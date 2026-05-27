import mongoose from 'mongoose';

const pendingPharmacistRegistrationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false, minlength: 6 },
    pharmacyName: { type: String, required: true, trim: true },
    pharmacyAddress: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, trim: true },
    verifyOtp: { type: String, required: true, select: false },
    verifyOtpExpires: { type: Date, required: true, select: false },
  },
  {
    timestamps: true,
    collection: 'pendingregistration',
  }
);

export default mongoose.model('PendingPharmacistRegistration', pendingPharmacistRegistrationSchema);
