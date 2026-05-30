import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const PatientSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date },
    relation: {
      type: String,
      enum: ['self', 'mother', 'father', 'grandmother', 'grandfather', 'spouse', 'other'],
      default: 'self',
    },
    allergies: { type: String, default: '' },
    pharmacyPin: { type: String, required: true }, // stored as bcrypt hash
    qrToken: { type: String, unique: true, index: true }, // UUID v4
    tempOtp: { type: String, default: null },
    tempOtpExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

PatientSchema.pre('save', async function () {
  if (this.isModified('pharmacyPin') && this.pharmacyPin.length <= 6) {
    this.pharmacyPin = await bcrypt.hash(this.pharmacyPin, 10);
  }
});

PatientSchema.methods.verifyPin = async function (pin) {
  return await bcrypt.compare(String(pin), this.pharmacyPin);
};

export default mongoose.models.Patient || mongoose.model('Patient', PatientSchema);
