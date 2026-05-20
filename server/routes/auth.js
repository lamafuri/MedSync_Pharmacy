import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import Pharmacist from '../models/Pharmacist.js';
import { generateOTP } from '../utils/generateOTP.js';
import { sendVerificationEmail, sendResetOTPEmail } from '../utils/sendEmail.js';

const router = express.Router();

// Rate limiter for OTP resend
const otpResendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many OTP requests, please try again later',
});

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id, role: 'pharmacist' }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// POST /api/auth/register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('pharmacyName').trim().notEmpty().withMessage('Pharmacy name is required'),
  body('pharmacyAddress').trim().notEmpty().withMessage('Pharmacy address is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('licenseNumber').trim().notEmpty().withMessage('License number is required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, pharmacyName, pharmacyAddress, phone, licenseNumber } = req.body;

    // Check if pharmacist already exists
    const existingPharmacist = await Pharmacist.findOne({ email });
    if (existingPharmacist) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create pharmacist
    const pharmacist = await Pharmacist.create({
      name,
      email,
      password,
      pharmacyName,
      pharmacyAddress,
      phone,
      licenseNumber,
      verifyOtp: otp,
      verifyOtpExpires: otpExpires,
    });

    // Send verification email
    await sendVerificationEmail(email, otp);

    res.status(201).json({
      message: 'Registration successful. Please check your email for verification code.',
      email,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const pharmacist = await Pharmacist.findOne({ email }).select('+password');
    if (!pharmacist) {
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

    res.json({
      token,
      pharmacist: {
        id: pharmacist._id,
        name: pharmacist.name,
        email: pharmacist.email,
        pharmacyName: pharmacist.pharmacyName,
        isPremium: pharmacist.isPremium,
        premiumExpiresAt: pharmacist.premiumExpiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('Invalid OTP format'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp } = req.body;

    const pharmacist = await Pharmacist.findOne({ email }).select('+verifyOtp +verifyOtpExpires');
    if (!pharmacist) {
      return res.status(404).json({ message: 'Pharmacist not found' });
    }

    if (pharmacist.verifyOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (new Date() > pharmacist.verifyOtpExpires) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    pharmacist.isVerified = true;
    pharmacist.verifyOtp = undefined;
    pharmacist.verifyOtpExpires = undefined;
    await pharmacist.save();

    const token = generateToken(pharmacist._id);

    res.json({
      token,
      pharmacist: {
        id: pharmacist._id,
        name: pharmacist.name,
        email: pharmacist.email,
        pharmacyName: pharmacist.pharmacyName,
        isPremium: pharmacist.isPremium,
        premiumExpiresAt: pharmacist.premiumExpiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/send-verify-otp
router.post('/send-verify-otp', otpResendLimiter, [
  body('email').isEmail().withMessage('Valid email is required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    const pharmacist = await Pharmacist.findOne({ email });
    if (!pharmacist) {
      return res.status(404).json({ message: 'Pharmacist not found' });
    }

    if (pharmacist.isVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

    pharmacist.verifyOtp = otp;
    pharmacist.verifyOtpExpires = otpExpires;
    await pharmacist.save();

    await sendVerificationEmail(email, otp);

    res.json({ message: 'Verification OTP sent successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/forgot-password/request-otp
router.post('/forgot-password/request-otp', [
  body('email').isEmail().withMessage('Valid email is required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    const pharmacist = await Pharmacist.findOne({ email });
    if (!pharmacist) {
      return res.status(404).json({ message: 'Pharmacist not found' });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

    pharmacist.resetOtp = otp;
    pharmacist.resetOtpExpires = otpExpires;
    await pharmacist.save();

    await sendResetOTPEmail(email, otp);

    res.json({ message: 'Password reset OTP sent successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/forgot-password/reset
router.post('/forgot-password/reset', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('Invalid OTP format'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp, newPassword } = req.body;

    const pharmacist = await Pharmacist.findOne({ email }).select('+resetOtp +resetOtpExpires +password');
    if (!pharmacist) {
      return res.status(404).json({ message: 'Pharmacist not found' });
    }

    if (pharmacist.resetOtp !== otp) {
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
});

// GET /api/auth/me
router.get('/me', async (req, res, next) => {
  try {
    // This route should be protected, but we'll add middleware in server.js
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
router.put('/me', [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('pharmacyName').optional().trim().notEmpty().withMessage('Pharmacy name cannot be empty'),
  body('pharmacyAddress').optional().trim().notEmpty().withMessage('Pharmacy address cannot be empty'),
  body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty'),
], async (req, res, next) => {
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
});

// PUT /api/auth/me/password
router.put('/me/password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], async (req, res, next) => {
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
});

// POST /api/auth/upgrade
router.post('/upgrade', async (req, res, next) => {
  try {
    const pharmacist = await Pharmacist.findById(req.pharmacist._id);
    if (!pharmacist) {
      return res.status(404).json({ message: 'Pharmacist not found' });
    }

    pharmacist.isPremium = true;
    pharmacist.premiumExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
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
