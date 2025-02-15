import crypto from 'crypto';
import Payment from '../models/Payment.js';
import userModel from '../models/UserModel.js';
import Package from '../models/Package.js';
import TutorSession from '../models/TutorSession.js';
import { logZoomEvent } from '../utils/eventLogger.js';
import ZoomWebhook from '../models/ZoomWebhook.js';


export const handlePaystackWebhook = async (req, res) => {
  console.log('Webhook Event:', JSON.stringify(req.body, null, 2));
  const paystackSignature = req.headers['x-paystack-signature'];
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  // Verify the webhook signature
  const hash = crypto.createHmac('sha512', secretKey).update(JSON.stringify(req.body)).digest('hex');
  if (hash !== paystackSignature) {
    return res.status(400).json({ message: 'Invalid signature' });
  }

  const event = req.body;

  try {
    if (event.event === 'charge.success') {
      const { reference, status } = event.data;

      // Find the payment record in your database
      const payment = await Payment.findOne({ transactionId: reference });
      if (!payment) {
        console.error('Payment record not found for reference:', reference);
        return res.status(404).json({ message: 'Payment record not found' });
      }

      // If the payment is already completed, avoid processing it again
      if (payment.status === 'Completed') {
        console.log(`Payment for reference ${reference} is already processed.`);
        return res.status(200).json({ message: 'Payment already processed.' });
      }

      // Update payment status
      payment.status = status === 'success' ? 'Completed' : 'Failed';
      await payment.save();

      console.log(`Payment status updated for reference ${reference}: ${payment.status}`);

      // If the payment is completed, update the user's tokens
      if (payment.status === 'Completed') {
        const user = await userModel.findById(payment.user);
        const purchasedPackage = await Package.findById(payment.package);

        if (!user || !purchasedPackage) {
          console.error('User or package not found for payment:', payment);
          return res.status(404).json({ message: 'User or package not found.' });
        }

        // Increment user tokens
        user.tokens = (user.tokens || 0) + purchasedPackage.credits;
        await user.save();

        console.log(`Tokens updated for user ${user.email}: ${user.tokens}`);
      }
    }

    res.status(200).json({ message: 'Webhook received successfully' });
  } catch (error) {
    console.error('Error processing webhook:', error.message || error);
    res.status(500).json({ message: 'Failed to process webhook', error });
  }
};



export const handleZoomWebhook = async (req, res) => {
  const { event, payload } = req.body;

  try {
    console.log("🔹 Received Zoom Webhook:", {
      event,
      payloadKeys: Object.keys(payload || {}),
      headers: req.headers,
    });

    // Handle URL validation event
    if (event === 'endpoint.url_validation') {
      console.log("Handling URL validation...");

      const { plainToken } = payload;

      if (!process.env.ZOOM_SECRET_TOKEN) {
        console.error("❌ ZOOM_SECRET_TOKEN is not set.");
        return res.status(500).send("Server misconfiguration");
      }

      try {
        const encryptedToken = crypto
          .createHmac("sha256", process.env.ZOOM_SECRET_TOKEN)
          .update(plainToken)
          .digest("hex");

        return res.status(200).json({ plainToken, encryptedToken });
      } catch (error) {
        console.error("❌ Error generating encrypted token:", error);
        return res.status(500).send("Error generating encrypted token");
      }
    }

    // Ensure meetingId is extracted properly
    let meetingId = payload?.object?.id || payload?.meetingId;
    if (!meetingId) {
      console.error("❌ Missing meetingId in webhook payload:", payload);
      return res.status(400).send("Missing meetingId in payload");
    }
    meetingId = String(meetingId);

    // Save the webhook event in the database
    const webhookEvent = new ZoomWebhook({
      event, // Type of event (e.g. 'meeting.participant_joined')
      meetingIds: [meetingId], // Save meetingId as an array
      timestamp: new Date(),
      rawPayload: payload, // Save raw payload for debugging
    });

    await webhookEvent.save();
    console.log("✅ Webhook event saved successfully:", webhookEvent);

    // Process participant events (joined/left)
    if (event === 'meeting.participant_joined' || event === 'meeting.participant_left') {
      const participant = payload?.object?.participant;
      if (!participant) {
        console.error("❌ Invalid participant data in payload:", payload);
        return res.status(400).send("Invalid participant data");
      }

      try {
        const session = await TutorSession.findOne({ zoomMeetingIds: meetingId });
        if (!session) {
          console.error(`❌ No session found for meeting ID: ${meetingId}`);
          return;
        }

        const participantDetails = {
          userId: participant.id || `Unknown-${Date.now()}`,
          userName: participant.user_name || "Unknown",
          joinTime: event === "meeting.participant_joined" ? new Date() : null,
          leaveTime: event === "meeting.participant_left" ? new Date() : null,
          duration: 0, // Will be updated later
        };

        if (event === "meeting.participant_joined") {
          session.participants.push(participantDetails);
        } else if (event === "meeting.participant_left") {
          const participantIndex = session.participants.findIndex(
            (p) => p.userId === participantDetails.userId
          );
          if (participantIndex !== -1) {
            session.participants[participantIndex].leaveTime = participantDetails.leaveTime;
            session.participants[participantIndex].duration =
              (session.participants[participantIndex].leaveTime - session.participants[participantIndex].joinTime) / 1000; // Convert to seconds
          }
        }

        await session.save();
        console.log(`✅ Participant event updated for meeting: ${meetingId}`);
        
      } catch (error) {
        console.error("❌ Error handling participant event:", error.message || error);
      }
    }

    // Process meeting ended event
    if (event === 'meeting.ended') {
      try {
        const session = await TutorSession.findOne({ zoomMeetingIds: meetingId });
        if (!session) {
          console.error(`❌ No session found for meeting ID: ${meetingId}`);
          return;
        }

        const { start_time, end_time, host_id, duration } = payload?.object;

        session.status = "accepted"; // Update session status
        session.endTime = new Date(end_time);

        // Ensure host is recorded if missing
        if (!session.hostId) {
          session.hostId = host_id;
        }

        // Update participant details
        session.participants = session.participants.map((p) => ({
          ...p,
          joinTime: p.joinTime || new Date(start_time), // Default to meeting start time
          leaveTime: p.leaveTime || new Date(end_time), // Default to meeting end time
          duration: p.leaveTime && p.joinTime ? (p.leaveTime - p.joinTime) / 1000 : duration, // Use meeting duration if participant duration is missing
        }));

        await session.save();
        console.log(`✅ Meeting Event: ${event} processed successfully for Meeting ID: ${meetingId}`);
      } catch (error) {
        console.error("❌ Error handling meeting event:", error.message || error);
      }
    }

    res.status(200).send("Webhook processed successfully");

  } catch (error) {
    console.error("❌ Error processing Zoom webhook:", error);
    res.status(500).send("Internal Server Error");
  }
};


