import mongoose from 'mongoose';

// Shared model from Website A - READ ONLY for Website B
const medicineSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  strength: {
    type: String,
    required: true,
    trim: true,
  },
  unit: {
    type: String,
    required: true,
    trim: true,
  },
  frequencyPerDay: {
    type: Number,
    required: true,
    min: 1,
  },
  dosePerIntake: {
    type: Number,
    required: true,
    min: 1,
  },
  currentStock: {
    type: Number,
    required: true,
    min: 0,
  },
  refillThreshold: {
    type: Number,
    default: 7,
    min: 1,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Medicine || mongoose.model('Medicine', medicineSchema);
