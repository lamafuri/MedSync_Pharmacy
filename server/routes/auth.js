import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import Pharmacist from '../models/Pharmacist.js';
import PendingPharmacistRegistration from '../models/PendingPharmacistRegistration.js';
import { generateOTP } from '../utils/generateOTP.js';
import { sendVerificationEmail, sendResetOTPEmail } from '../utils/sendEmail.js';

const router = express.Router();

const otpResendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many OTP requests, please try again later',
});

const generateToken = (id) =>
  jwt.sign({ id, role: 'pharmacist' }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

function pharmacistResponse(pharmacist) {
  return {
    id: pharmacist._id,
    name: pharmacist.name,
    email: pharmacist.email,
    pharmacyName: pharmacist.pharmacyName,
    isPremium: pharmacist.isPremium,
    premiumExpiresAt: pharmacist.premiumExpiresAt,
  };
}

async function sendRegistrationOtp(pending) {
  try {
    await sendVerificationEmail(pending.email, pending.verifyOtp);
  } catch (error) {
    // Log error without sensitive information
    // console.error('Failed to send verification email:', error.message);
    throw error;
  }
}

// POST /api/auth/register — stores in pending collection only until verified
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('pharmacyName').trim().notEmpty().withMessage('Pharmacy name is required'),
    body('pharmacyAddress').trim().notEmpty().withMessage('Pharmacy address is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('licenseNumber').trim().notEmpty().withMessage('License number is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password, pharmacyName, pharmacyAddress, phone, licenseNumber } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      const existingPharmacist = await Pharmacist.findOne({ email: normalizedEmail });
      if (existingPharmacist) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

      let pending = await PendingPharmacistRegistration.findOne({ email: normalizedEmail }).select(
        '+verifyOtp +verifyOtpExpires +password'
      );

      if (pending) {
        pending.name = name;
        pending.password = password;
        pending.pharmacyName = pharmacyName;
        pending.pharmacyAddress = pharmacyAddress;
        pending.phone = phone;
        pending.licenseNumber = licenseNumber;
        pending.verifyOtp = otp;
        pending.verifyOtpExpires = otpExpires;
      } else {
        pending = new PendingPharmacistRegistration({
          name,
          email: normalizedEmail,
          password,
          pharmacyName,
          pharmacyAddress,
          phone,
          licenseNumber,
          verifyOtp: otp,
          verifyOtpExpires: otpExpires,
        });
      }

      await pending.save();
      
      try {
        await sendRegistrationOtp(pending);
      } catch (emailError) {
        // If email sending fails, still save the pending registration
        // but inform the user about the email issue
        // console.error('Email sending failed but registration saved:', emailError.message);
        return res.status(503).json({
          message: 'Registration saved but email service unavailable. Please request OTP resend.',
          email: normalizedEmail,
          needsResend: true,
        });
      }

      res.status(201).json({
        message: 'Registration started. Please check your email for the verification code.',
        email: normalizedEmail,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      const pharmacist = await Pharmacist.findOne({ email: normalizedEmail }).select('+password');
      if (!pharmacist) {
        const pending = await PendingPharmacistRegistration.findOne({ email: normalizedEmail }).select('+password');
        if (pending) {
          const pendingMatch = password === pending.password;
          if (pendingMatch) {
            return res.status(403).json({
              needsVerification: true,
              email: normalizedEmail,
              message: 'Please verify your email first',
            });
          }
        }
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isMatch = await pharmacist.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (!pharmacist.isVerified) {
        return res.status(403).json({
          needsVerification: true,
          email: pharmacist.email,
          message: 'Please verify your email first',
        });
      }

      const token = generateToken(pharmacist._id);
      res.json({ token, pharmacist: pharmacistResponse(pharmacist) });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/verify-email — creates pharmacist, removes pending
router.post(
  '/verify-email',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('Invalid OTP format'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, otp } = req.body;
      const normalizedEmail = email.toLowerCase().trim();
      const otpStr = String(otp).trim();

      const pending = await PendingPharmacistRegistration.findOne({ email: normalizedEmail }).select(
        '+verifyOtp +verifyOtpExpires +password'
      );

      if (!pending) {
        return res.status(404).json({ message: 'No pending registration found for this email' });
      }

      if (pending.verifyOtp !== otpStr) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }

      if (new Date() > pending.verifyOtpExpires) {
        return res.status(400).json({ message: 'OTP has expired' });
      }

      const existingPharmacist = await Pharmacist.findOne({ email: normalizedEmail });
      if (existingPharmacist) {
        await PendingPharmacistRegistration.deleteOne({ _id: pending._id });
        if (!existingPharmacist.isVerified) {
          existingPharmacist.isVerified = true;
          await existingPharmacist.save();
        }
        const token = generateToken(existingPharmacist._id);
        return res.json({ token, pharmacist: pharmacistResponse(existingPharmacist) });
      }

      const pharmacist = await Pharmacist.create({
        name: pending.name,
        email: pending.email,
        password: pending.password,
        pharmacyName: pending.pharmacyName,
        pharmacyAddress: pending.pharmacyAddress,
        phone: pending.phone,
        licenseNumber: pending.licenseNumber,
        isVerified: true,
      });

      await PendingPharmacistRegistration.deleteOne({ _id: pending._id });

      const token = generateToken(pharmacist._id);
      res.json({ token, pharmacist: pharmacistResponse(pharmacist) });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/send-verify-otp
router.post(
  '/send-verify-otp',
  otpResendLimiter,
  [body('email').isEmail().withMessage('Valid email is required')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const normalizedEmail = req.body.email.toLowerCase().trim();

      const verified = await Pharmacist.findOne({ email: normalizedEmail, isVerified: true });
      if (verified) {
        return res.status(400).json({ message: 'Email already verified' });
      }

      let pending = await PendingPharmacistRegistration.findOne({ email: normalizedEmail }).select(
        '+verifyOtp +verifyOtpExpires'
      );

      if (!pending) {
        return res.status(404).json({ message: 'No pending registration found for this email' });
      }

      const otp = generateOTP();
      pending.verifyOtp = otp;
      pending.verifyOtpExpires = new Date(Date.now() + 15 * 60 * 1000);
      await pending.save();

      try {
        await sendRegistrationOtp(pending);
      } catch (emailError) {
        // console.error('Email sending failed:', emailError.message);
        return res.status(503).json({
          message: 'Email service unavailable. Please try again later.',
        });
      }

      res.json({ message: 'Verification OTP sent successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/forgot-password/request-otp
router.post(
  '/forgot-password/request-otp',
  [body('email').isEmail().withMessage('Valid email is required')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const normalizedEmail = req.body.email.toLowerCase().trim();
      const pharmacist = await Pharmacist.findOne({ email: normalizedEmail });

      if (!pharmacist) {
        return res.status(404).json({ message: 'Pharmacist not found' });
      }

      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

      pharmacist.resetOtp = otp;
      pharmacist.resetOtpExpires = otpExpires;
      await pharmacist.save();

      try {
        await sendResetOTPEmail(normalizedEmail, otp);
      } catch (emailError) {
        // console.error('Email sending failed:', emailError.message);
        return res.status(503).json({
          message: 'Email service unavailable. Please try again later.',
        });
      }

      res.json({ message: 'Password reset OTP sent successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/forgot-password/reset
router.post(
  '/forgot-password/reset',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('Invalid OTP format'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, otp, newPassword } = req.body;
      const normalizedEmail = email.toLowerCase().trim();
      const otpStr = String(otp).trim();

      const pharmacist = await Pharmacist.findOne({ email: normalizedEmail }).select(
        '+resetOtp +resetOtpExpires +password'
      );
      if (!pharmacist) {
        return res.status(404).json({ message: 'Pharmacist not found' });
      }

      if (pharmacist.resetOtp !== otpStr) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }

      if (new Date() > pharmacist.resetOtpExpires) {
        return res.status(400).json({ message: 'OTP has expired' });
      }

      pharmacist.password = newPassword;
      pharmacist.resetOtp = undefined;
      pharmacist.resetOtpExpires = undefined;
      await pharmacist.save();

      res.json({ message: 'Password reset successful' });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/auth/me
router.get('/me', async (req, res, next) => {
  try {
    const pharmacist = await Pharmacist.findById(req.pharmacist._id);
    if (!pharmacist) {
      return res.status(404).json({ message: 'Pharmacist not found' });
    }

    res.json({
      id: pharmacist._id,
      name: pharmacist.name,
      email: pharmacist.email,
      pharmacyName: pharmacist.pharmacyName,
      pharmacyAddress: pharmacist.pharmacyAddress,
      phone: pharmacist.phone,
      licenseNumber: pharmacist.licenseNumber,
      isVerified: pharmacist.isVerified,
      isPremium: pharmacist.isPremium,
      premiumExpiresAt: pharmacist.premiumExpiresAt,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/auth/me
router.put(
  '/me',
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('pharmacyName').optional().trim().notEmpty().withMessage('Pharmacy name cannot be empty'),
    body('pharmacyAddress').optional().trim().notEmpty().withMessage('Pharmacy address cannot be empty'),
    body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, pharmacyName, pharmacyAddress, phone } = req.body;
      const pharmacist = await Pharmacist.findById(req.pharmacist._id);
      if (!pharmacist) {
        return res.status(404).json({ message: 'Pharmacist not found' });
      }

      if (name) pharmacist.name = name;
      if (pharmacyName) pharmacist.pharmacyName = pharmacyName;
      if (pharmacyAddress) pharmacist.pharmacyAddress = pharmacyAddress;
      if (phone) pharmacist.phone = phone;

      await pharmacist.save();

      res.json({
        id: pharmacist._id,
        name: pharmacist.name,
        email: pharmacist.email,
        pharmacyName: pharmacist.pharmacyName,
        pharmacyAddress: pharmacist.pharmacyAddress,
        phone: pharmacist.phone,
        licenseNumber: pharmacist.licenseNumber,
        isVerified: pharmacist.isVerified,
        isPremium: pharmacist.isPremium,
        premiumExpiresAt: pharmacist.premiumExpiresAt,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/auth/me/password
router.put(
  '/me/password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;
      const pharmacist = await Pharmacist.findById(req.pharmacist._id).select('+password');
      if (!pharmacist) {
        return res.status(404).json({ message: 'Pharmacist not found' });
      }

      const isMatch = await pharmacist.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      pharmacist.password = newPassword;
      await pharmacist.save();

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/upgrade
router.post('/upgrade', async (req, res, next) => {
  try {
    const pharmacist = await Pharmacist.findById(req.pharmacist._id);
    if (!pharmacist) {
      return res.status(404).json({ message: 'Pharmacist not found' });
    }

    pharmacist.isPremium = true;
    pharmacist.premiumExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    await pharmacist.save();

    res.json({
      message: 'Upgraded to premium successfully',
      premiumExpiresAt: pharmacist.premiumExpiresAt,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
