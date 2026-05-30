import mongoose from 'mongoose';

const pharmacistLinkSchema = new mongoose.Schema(
  {
    pharmacistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacist',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    linkedAt: {
      type: Date,
      default: Date.now,
    },
    linkMethod: {
      type: String,
      enum: ['otp', 'qr'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate links between same pharmacist and patient
pharmacistLinkSchema.index({ pharmacistId: 1, userId: 1 }, { unique: true });

export default mongoose.models.PharmacistLink || mongoose.model('PharmacistLink', pharmacistLinkSchema);
