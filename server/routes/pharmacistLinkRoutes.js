import express from 'express';
import { body } from 'express-validator';
import {
  linkViaOtp,
  linkViaQr,
  getLinkedPatients,
  unlinkPatient,
} from '../controllers/pharmacistLinkController.js';
import { protectPharmacist } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protectPharmacist);

// Link patient via OTP
router.post(
  '/link/otp',
  [body('otp').isLength({ min: 8, max: 8 }).withMessage('OTP must be 8 digits')],
  linkViaOtp
);

// Link patient via QR token
router.post(
  '/link/qr',
  [body('qrToken').notEmpty().withMessage('QR token is required')],
  linkViaQr
);

// Get all linked patients for the pharmacist
router.get('/linked-patients', getLinkedPatients);

// Unlink a patient
router.delete('/unlink/:linkId', unlinkPatient);

export default router;
