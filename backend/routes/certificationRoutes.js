import express from 'express';
import upload from '../middleware/multer.js';
import { submitCertification, verifyCertification, getCertificationStatus } from '../controllers/certificationController.js';

const router = express.Router();

// Route for tutors to submit their certification documents (supports multiple files)
router.post('/:profileId/certification', upload.array('certification'), submitCertification);

// Route for admin to verify the certification (ensure proper admin auth in production)
router.post('/:profileId/certification/verify', verifyCertification);

// New route: GET certification status for a tutor
router.get('/:profileId/certification/status', getCertificationStatus);

export default router;
