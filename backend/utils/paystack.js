import axios from 'axios';
import Transaction from '../models/Transaction.js';
import TutorSession from '../models/TutorSession.js';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// ✅ Register Paystack Recipient (Bank or M-Pesa)
export const registerPaystackRecipient = async (tutor) => {
    try {
      let accountNumber = tutor.mpesaPhoneNumber.trim();
  
      // ✅ Ensure the phone number is correctly formatted
      if (accountNumber.startsWith('+254')) {
        accountNumber = accountNumber.replace('+254', '0'); // Convert +254 to 07xxx format
      } else if (accountNumber.startsWith('254')) {
        accountNumber = accountNumber.replace('254', '0'); // Convert 254 to 07xxx
      }
  
      console.log('🔹 Reformatted Paystack Account Number:', accountNumber);
  
      const payload = {
        type: 'mobile_money',
        name: tutor.name,
        account_number: accountNumber,
        bank_code: 'MPESA',
        currency: 'KES',
      };
  
      console.log('🔹 Paystack Recipient Payload:', payload);
  
      const response = await axios.post('https://api.paystack.co/transferrecipient', payload, {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (response.data && response.data.status) {
        console.log('✅ Paystack Recipient Created:', response.data);
        return response.data.data.recipient_code;
      } else {
        console.error('❌ Paystack Recipient Error:', response.data);
        return null;
      }
    } catch (error) {
      console.error('❌ Error registering Paystack recipient:', error.response?.data || error.message);
      return null;
    }
  };

  export const sendPaystackTransfer = async (recipientCode, amount, sessionId) => {
    try {
        console.log(`🔹 Initiating Paystack Transfer:`, { recipientCode, amount, sessionId });

        // ✅ Ensure session exists
        const tutorSession = await TutorSession.findById(sessionId);
        if (!tutorSession) {
            console.error(`❌ No TutorSession found with ID: ${sessionId}`);
            return null;
        }

        console.log(`✅ TutorSession verified: ${tutorSession._id}`);

        // ✅ Prepare Paystack transfer payload
        const payload = {
            source: 'balance', // Funds from business Paystack account balance
            amount: amount * 100, // Convert to kobo
            recipient: recipientCode,
            reason: `Tutor Session Payment for session ID: ${tutorSession._id}`,
        };

        // ✅ Send transfer request to Paystack
        const response = await axios.post('https://api.paystack.co/transfer', payload, {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        console.log(`✅ Paystack Transfer Response:`, response.data);

        if (response.data && response.data.status) {
            const paystackReference = response.data.data.reference;

            // ✅ Update the TutorSession collection (Mark as completed)
            const updatedSession = await TutorSession.findByIdAndUpdate(
                tutorSession._id,
                { paystackReference: paystackReference, status: 'Completed' },
                { new: true }
            );

            if (!updatedSession) {
                console.error(`❌ No TutorSession found for update with ID ${tutorSession._id}.`);
                return null;
            }

            console.log('✅ TutorSession updated with Paystack reference:', paystackReference);

            return response.data;
        } else {
            console.error('❌ Paystack Transfer Error:', response.data);
        }

        return null;
    } catch (error) {
        console.error(`❌ Error processing Paystack transfer:`, error.response?.data || error.message);
        return null;
    }
};
