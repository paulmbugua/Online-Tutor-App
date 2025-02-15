import express from 'express';

import { handlePaystackWebhook, handleZoomWebhook, } from '../controllers/webhookController.js';



const router = express.Router();

// Webhook endpoint
router.post('/webhook/paystack', express.json(), handlePaystackWebhook);

router.post('/webhook/zoom', handleZoomWebhook);




export default router;