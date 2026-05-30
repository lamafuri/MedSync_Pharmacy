import mongoose from 'mongoose';

const MedicineSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    name: { type: String, required: true, trim: true },
    strength: { type: String, required: true },
    unit: { type: String, enum: ['mg', 'ml', 'IU', 'mcg'], default: 'mg' },
    frequencyPerDay: { type: Number, required: true, min: 1, max: 24 },
    dosePerIntake: { type: Number, required: true, min: 0.5 },
    currentStock: { type: Number, required: true, min: 0 },
    refillThreshold: { type: Number, default: 7 },
    instructions: { type: String, default: '' },
    doctorName: { type: String, default: '' },
    hospitalName: { type: String, default: '' },
    prescriptionDate: { type: Date },
    prescriptionValid: { type: Date },
    prescriptionImgUrl: { type: String, default: '' },
    prescriptionImgId: { type: String, default: '' },
    medicinePhotoUrl: { type: String, default: '' },
    medicinePhotoId: { type: String, default: '' },
    firstDoseTime: { type: String, default: '08:00' },
    remindersEnabled: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    lastReducedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Medicine || mongoose.model('Medicine', MedicineSchema);
