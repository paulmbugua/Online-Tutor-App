// controllers/paymentController.js
import { stkPush } from '../services/mpesaService.js';
import Package from '../models/Package.js';
import Payment from '../models/Payment.js';
import validatePayment from '../validators/paymentValidation.js';
import userModel from '../models/UserModel.js';
import Transaction from '../models/Transaction.js';

export const getPackages = async (req, res) => {
  try {
    const packages = await Package.find();
    if (!packages.length) {
      return res.status(404).json({ message: 'No packages found' });
    }
    res.status(200).json(packages);
  } catch (error) {
    console.error('Error fetching packages:', error.message || error);
    res.status(500).json({ message: 'Failed to fetch packages', error });
  }
};

export const initializeMpesaPayment = async (req, res) => {
  // Validate the incoming request
  const { error, value } = validatePayment(req.body);
  if (error) {
    return res.status(400).json({
      message: 'Validation error',
      details: error.details.map((err) => err.message),
    });
  }

  const { amount, phone, packageId, paymentMethod } = value;

  try {
    // Ensure the selected package exists
    const selectedPackage = await Package.findById(packageId);
    if (!selectedPackage) {
      return res.status(404).json({ message: 'Package not found' });
    }

    let paymentResponse;
    let transactionId;

    // Initiate the correct M-Pesa payment based on paymentMethod
    if (paymentMethod === 'MPESA') {
      // Call your STK push function (expects req, res in your original implementation;
      // refactor if needed so you can call it as a function)
      const responseData = await stkPush({ body: { phone, amount, userId: req.user?._id } }, { 
        status: () => ({ json: (data) => data }) 
      });
      paymentResponse = responseData.data; // Assume it returns data with CheckoutRequestID
      transactionId = paymentResponse?.CheckoutRequestID;
    } else if (paymentMethod === 'B2C') {
      const responseData = await b2cPayment({ body: { phone, amount, userId: req.user?._id } }, { 
        status: () => ({ json: (data) => data }) 
      });
      paymentResponse = responseData.data; // Assume it returns data with ConversationID
      transactionId = paymentResponse?.ConversationID;
    } else {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    if (!transactionId) {
      console.error('M-Pesa response error:', paymentResponse);
      return res.status(500).json({
        message: 'Failed to initialize payment. M-Pesa response invalid.',
        response: paymentResponse,
      });
    }

    // Create a Payment record
    const payment = new Payment({
      user: req.user?._id,
      package: packageId,
      amount,
      paymentMethod,
      transactionId,
      status: 'Pending',
    });
    await payment.save();

    return res.status(200).json({
      transactionId,
      message: 'Payment initialized successfully. Complete the transaction on your phone.',
    });
  } catch (error) {
    console.error('Payment initialization error:', error.message || error);
    res.status(500).json({ message: 'Failed to initialize payment', error });
  }
};

export const handleMpesaPaymentSuccess = async (req, res) => {
  try {
    // Use the authenticated user's _id from req.user instead of req.body.userId
    const userId = req.user._id;
    const { packageId } = req.body;

    console.log("handleMpesaPaymentSuccess called with userId:", userId, "and packageId:", packageId);

    // Fetch user and package
    const user = await userModel.findById(userId);
    const selectedPackage = await Package.findById(packageId);

    if (!user) {
      console.error('User not found:', userId);
      return res.status(404).json({ message: 'User not found.' });
    }
    if (!selectedPackage) {
      console.error('Package not found:', packageId);
      return res.status(404).json({ message: 'Package not found.' });
    }

    // Award tokens to the user
    user.tokens += selectedPackage.credits;
    await user.save();

    console.log('User tokens updated:', user.tokens);
    return res.status(200).json({
      message: 'Payment successful and tokens updated.',
      tokens: user.tokens,
    });
  } catch (error) {
    console.error('Error processing payment success:', error.message || error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};


export const useTokensForService = async (req, res) => {
  const { userId, requiredTokens } = req.body;
  try {
    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.tokens < requiredTokens) {
      return res.status(400).json({ message: 'Insufficient tokens.' });
    }
    user.tokens -= requiredTokens;
    await user.save();
    return res.status(200).json({
      message: 'Tokens deducted successfully.',
      tokens: user.tokens,
    });
  } catch (error) {
    console.error('Error deducting tokens:', error.message || error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.profileId })
      .sort({ date: -1 })
      .lean();
    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
};


export const confirmMpesaPayment = async (req, res) => {
  const { reference } = req.params; // Reference here is the transactionId used when initiating payment
  try {
    // Find the Payment record by transactionId
    const payment = await Payment.findOne({ transactionId: reference });
    if (!payment) {
      return res.status(404).json({ message: "Payment record not found." });
    }
    
    // Check if the mpesaReference exists, which indicates that MPesa callback has been processed
    if (!payment.mpesaReference) {
      return res.status(400).json({ message: "Payment not completed yet." });
    }
    
    // Return a successful confirmation with the mpesaReference
    res.status(200).json({
      success: true,
      message: "Payment confirmed.",
      mpesaReference: payment.mpesaReference
    });
  } catch (error) {
    console.error("Error confirming payment:", error.message || error);
    res.status(500).json({ message: "Failed to confirm payment", error: error.message });
  }
};
