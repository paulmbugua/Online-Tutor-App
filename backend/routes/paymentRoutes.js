// routes/paymentRoutes.js
import express from 'express';
import {
  getPackages,
  initializeMpesaPayment,
  handleMpesaPaymentSuccess,
  useTokensForService,
  getTransactions,
  confirmMpesaPayment
} from '../controllers/paymentController.js';
import authUser from '../middleware/authUser.js'; // Use your existing authUser middleware

const router = express.Router();

// Public route if needed
router.get('/packages', getPackages);

// Protected routes: Only accessible if the user is authenticated (authUser sets req.user)
router.post('/initiate', authUser, initializeMpesaPayment);
router.post('/success', authUser, handleMpesaPaymentSuccess);
router.post('/use-tokens', authUser, useTokensForService);
router.get('/transactions', authUser, getTransactions);
router.get('/confirm/:reference', authUser, confirmMpesaPayment);


export default router;

