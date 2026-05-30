import mongoose from 'mongoose';

// Shared model from Website A - READ ONLY for Website B
const patientSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  allergies: [{
    type: String,
    trim: true,
  }],
  pharmacyPin: {
    type: String,
    select: false,
  },
  qrToken: {
    type: String,
    required: true,
    unique: true,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Patient || mongoose.model('Patient', patientSchema);
