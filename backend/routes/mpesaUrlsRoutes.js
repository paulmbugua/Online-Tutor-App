// routes/mpesaCallbackRoutes.js
import express from 'express';
import { mpesaCallback, b2cResult } from '../controllers/mpesaUrls.js';

const router = express.Router();

// Expose a POST endpoint for M-Pesa callbacks
router.post('/callback', mpesaCallback);
router.post("/b2c-result", b2cResult);

export default router;
