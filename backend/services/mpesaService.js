// controllers/mpesaController.js
import axios from "axios";
import Transaction from "../models/Transaction.js";
import {
  getAccessToken,
  password,
  shortcode,
  b2cShortcode,
  callbackURL,
  timeoutURL,
  resultURL,
  timestamp,
  initiatorName,
} from "../utils/mpesa.js";
import { normalizePhoneNumber } from '../utils/phoneUtils.js';




// STK Push (C2B) Payment
export async function stkPush(req, res) {
  const { phone, amount, userId } = req.body;
  const normalizedPhone = normalizePhoneNumber(phone);
  try {
    const accessToken = await getAccessToken();
    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: normalizedPhone,
      PartyB: shortcode,
      PhoneNumber: normalizedPhone,
      CallBackURL: callbackURL,
      AccountReference: "TutorAppPayment",
      TransactionDesc: "Tutor Payment",
    };

    const response = await axios.post(
      "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

// Send a response that can be used internally
    return res.status(200).json({
      message: "STK Push Sent",
      data: response.data,
    });
  } catch (error) {
    console.error("STK Push Error:", error.response?.data || error.message);
    return res.status(500).json({ error: "Failed to process payment" });
  }
}


// B2C Payout (for tutor payouts)
export async function initiateB2CPayment(phone, amount, userId) {
    try {
      const accessToken = await getAccessToken();
      const payload = {
        InitiatorName: initiatorName, // Use the environment variable
        SecurityCredential: securityCredential,           // Ensure this is correctly generated
        CommandID: "SalaryPayment",
        Amount: amount,
        PartyA: b2cShortcode,                              // Should be the correct sandbox shortcode, e.g., "600000"
        PartyB: phone,
        Remarks: "Tutor Payment",
        QueueTimeOutURL: timeoutURL,
        ResultURL: resultURL,
        Occasion: "Tutor Payout",
      };
      
  

      const response = await axios.post(
        "https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest",
        payload,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
  
      const transaction = new Transaction({
        userId,
        type: "Completed Earnings",
        amount,
        description: "Tutor payout via M-Pesa",
        status: "Completed",
        mpesaReference: response.data.ConversationID,
        phoneNumber: phone,
        paymentMethod: "B2C",
      });
      await transaction.save();
  
      return response.data;
    } catch (error) {
      console.error("B2C Payment initiation error:", error.response?.data || error.message);
      throw new Error("B2C Payment initiation failed");
    }
  }