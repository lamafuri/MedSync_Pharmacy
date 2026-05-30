import mongoose from 'mongoose';

const PharmacistInvitationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  otp: { type: String, required: true },
  qrToken: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  otpUsed: { type: Boolean, default: false },
  qrUsed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

PharmacistInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.PharmacistInvitation || mongoose.model('PharmacistInvitation', PharmacistInvitationSchema);
