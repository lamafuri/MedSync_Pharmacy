import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const pharmacistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false,
    minlength: 6,
  },
  pharmacyName: {
    type: String,
    required: [true, 'Pharmacy name is required'],
    trim: true,
  },
  pharmacyAddress: {
    type: String,
    required: [true, 'Pharmacy address is required'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  licenseNumber: {
    type: String,
    required: [true, 'License number is required'],
    trim: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  premiumExpiresAt: {
    type: Date,
  },
  verifyOtp: {
    type: String,
    select: false,
  },
  verifyOtpExpires: {
    type: Date,
    select: false,
  },
  resetOtp: {
    type: String,
    select: false,
  },
  resetOtpExpires: {
    type: Date,
    select: false,
  },
}, {
  timestamps: true,
});

// Hash password before saving
pharmacistSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to match password
pharmacistSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('Pharmacist', pharmacistSchema);
