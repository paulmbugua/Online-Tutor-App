import mongoose from 'mongoose';
import Payment from "../models/Payment.js";
import userModel from "../models/UserModel.js";
import Package from "../models/Package.js";

export async function mpesaCallback(req, res) {
  // Start a session for a transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    console.log("Received M-Pesa callback:", req.body);

    // Extract the STK callback details from the payload
    const stkCallback = req.body.Body?.stkCallback;
    if (!stkCallback) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Invalid callback payload" });
    }

    const { CheckoutRequestID, ResultCode, CallbackMetadata } = stkCallback;

    // For a successful transaction, ResultCode should be 0.
    if (ResultCode === 0) {
      // Build the update object. Find the payment that is not already completed.
      const updateData = { status: "Completed" };
      const receiptItem = CallbackMetadata?.Item.find(item => item.Name === "MpesaReceiptNumber");
      if (receiptItem) {
        updateData.mpesaReference = receiptItem.Value;
      }

      // Use an atomic findOneAndUpdate with a condition that status is not already "Completed"
      const payment = await Payment.findOneAndUpdate(
        { transactionId: CheckoutRequestID, status: { $ne: "Completed" } },
        { $set: updateData },
        { new: true, session }
      );
      
      if (!payment) {
        // Either payment not found or already processed
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: "Payment record not found or already processed." });
      }

      // Update the user's token balance only if package and user references are present
      const selectedPackage = await Package.findById(payment.package).session(session);
      const user = await userModel.findById(payment.user).session(session);
      if (selectedPackage && user) {
        user.tokens += selectedPackage.credits;
        await user.save({ session });
        console.log("Payment successful. Tokens awarded. User tokens updated to:", user.tokens);
      } else {
        console.error("Failed to retrieve package or user for token update.");
      }
      
    } else {
      // For a failed payment, update the status to "Failed"
      await Payment.findOneAndUpdate(
        { transactionId: CheckoutRequestID },
        { $set: { status: "Failed" } },
        { new: true, session }
      );
      console.log("Payment failed with ResultCode:", ResultCode);
    }

    // Commit the transaction after all updates
    await session.commitTransaction();
    session.endSession();

    // Acknowledge receipt of the callback
    res.status(200).json({ message: "Callback processed successfully" });
  } catch (error) {
    // Abort the transaction in case of any errors
    await session.abortTransaction();
    session.endSession();
    console.error("Error processing M-Pesa callback:", error.message || error);
    res.status(500).json({ message: "Failed to process callback", error: error.message });
  }
}


export const b2cResult = async (req, res) => {
  try {
    // Log the entire payload for debugging and processing.
    console.log("Received B2C Result Callback:", req.body);

    // Example: You may want to extract and process the result.
    // const result = req.body.Result;
    // Update your transaction record in the database based on result.ResultCode or other fields.

    // Acknowledge receipt with a 200 status code.
    return res.status(200).json({ message: "B2C result processed successfully" });
  } catch (error) {
    console.error("Error processing B2C result callback:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
