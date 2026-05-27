import express from 'express';
import { body, validationResult } from 'express-validator';
import PatientLink from '../models/PatientLink.js';
import Patient from '../models/shared/Patient.js';
import Medicine from '../models/shared/Medicine.js';
import Offer from '../models/Offer.js';

const router = express.Router();

// Helper function to calculate stock status
const calculateStockStatus = (medicine) => {
  const dailyUsage = medicine.frequencyPerDay * medicine.dosePerIntake;
  const daysLeft = Math.floor(medicine.currentStock / dailyUsage);
  
  let stockStatus = 'green';
  if (daysLeft <= 3) {
    stockStatus = 'red';
  } else if (daysLeft <= medicine.refillThreshold) {
    stockStatus = 'amber';
  }
  
  return { stockStatus, daysLeft };
};

// GET /api/dashboard/patients
router.get('/patients', async (req, res, next) => {
  try {
    const pharmacistId = req.pharmacist._id;

    // Fetch all PatientLinks for this pharmacist
    const patientLinks = await PatientLink.find({ pharmacistId });

    const patients = [];

    for (const link of patientLinks) {
      // Fetch patient from shared DB
      const patient = await Patient.findById(link.patientId);
      if (!patient) continue;

      // Fetch active medicines from shared DB
      const medicines = await Medicine.find({ 
        patientId: patient._id,
        isActive: true 
      });

      // Calculate stock status for each medicine
      const medicinesWithStatus = medicines.map(med => ({
        _id: med._id,
        name: med.name,
        strength: med.strength,
        unit: med.unit,
        currentStock: med.currentStock,
        frequencyPerDay: med.frequencyPerDay,
        dosePerIntake: med.dosePerIntake,
        refillThreshold: med.refillThreshold,
        ...calculateStockStatus(med),
      }));

      // Determine alert level (worst medicine status)
      let alertLevel = 'green';
      const medicinesNeedingRefill = medicinesWithStatus.filter(m => m.stockStatus !== 'green');
      
      if (medicinesWithStatus.some(m => m.stockStatus === 'red')) {
        alertLevel = 'red';
      } else if (medicinesWithStatus.some(m => m.stockStatus === 'amber')) {
        alertLevel = 'amber';
      }

      patients.push({
        _id: patient._id,
        name: patient.name,
        allergies: patient.allergies,
        qrToken: patient.qrToken,
        patientEmail: link.patientEmail,
        patientPhone: link.patientPhone,
        patientAddress: link.patientAddress,
        alertLevel,
        medicinesNeedingRefill: medicinesNeedingRefill.length,
        medicines: medicinesWithStatus,
        notifyLowStock: link.notifyLowStock,
        notifyOffers: link.notifyOffers,
      });
    }

    // Sort: red → amber → green
    const sortOrder = { red: 0, amber: 1, green: 2 };
    patients.sort((a, b) => sortOrder[a.alertLevel] - sortOrder[b.alertLevel]);

    // Calculate stats
    const totalPatients = patients.length;
    const criticalCount = patients.filter(p => p.alertLevel === 'red').length;
    const warningCount = patients.filter(p => p.alertLevel === 'amber').length;
    
    // Count offers sent today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const offersSentToday = await Offer.countDocuments({
      pharmacistId,
      status: 'sent',
      sentAt: { $gte: todayStart },
    });

    res.json({
      patients,
      stats: {
        totalPatients,
        criticalCount,
        warningCount,
        offersSentToday,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/dashboard/patients/link
router.post('/patients/link', [
  body('qrToken').trim().notEmpty().withMessage('QR token is required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { qrToken, patientEmail, patientPhone, patientAddress } = req.body;
    const pharmacistId = req.pharmacist._id;

    // Find patient by qrToken in shared DB
    const patient = await Patient.findOne({ qrToken });
    if (!patient) {
      return res.status(404).json({ message: 'Invalid QR token or patient not found' });
    }

    // Check if already linked
    const existingLink = await PatientLink.findOne({
      pharmacistId,
      patientId: patient._id,
    });

    if (existingLink) {
      return res.status(400).json({ message: 'Patient already linked' });
    }

    // Create PatientLink
    const patientLink = await PatientLink.create({
      pharmacistId,
      patientId: patient._id,
      qrToken,
      patientEmail: patientEmail || null,
      patientPhone: patientPhone || null,
      patientAddress: patientAddress || null,
    });

    res.json({
      patient: {
        _id: patient._id,
        name: patient.name,
      },
      linked: true,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/dashboard/patients/:patientId/unlink
router.delete('/patients/:patientId/unlink', async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const pharmacistId = req.pharmacist._id;

    const result = await PatientLink.deleteOne({
      pharmacistId,
      patientId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Patient link not found' });
    }

    res.json({ message: 'Patient unlinked successfully' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/dashboard/patients/:patientId/contact
router.put('/patients/:patientId/contact', [
  body('patientEmail').optional().isEmail().withMessage('Valid email is required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { patientId } = req.params;
    const { patientEmail, patientPhone, patientAddress } = req.body;
    const pharmacistId = req.pharmacist._id;

    const patientLink = await PatientLink.findOne({
      pharmacistId,
      patientId,
    });

    if (!patientLink) {
      return res.status(404).json({ message: 'Patient link not found' });
    }

    if (patientEmail !== undefined) patientLink.patientEmail = patientEmail;
    if (patientPhone !== undefined) patientLink.patientPhone = patientPhone;
    if (patientAddress !== undefined) patientLink.patientAddress = patientAddress;

    await patientLink.save();

    res.json({
      patientEmail: patientLink.patientEmail,
      patientPhone: patientLink.patientPhone,
      patientAddress: patientLink.patientAddress,
    });
  } catch (error) {
    next(error);
// POST /api/dashboard/patients/bulk-email
router.post('/patients/bulk-email', [
  body('patientIds').isArray().withMessage('patientIds must be an array'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { patientIds, subject, message } = req.body;
    const pharmacistId = req.pharmacist._id;
    const pharmacyName = req.pharmacist.pharmacyName || req.pharmacist.name;

    // Find links for these patients
    const patientLinks = await PatientLink.find({
      pharmacistId,
      patientId: { $in: patientIds },
    });

    const emails = patientLinks
      .map(link => link.patientEmail)
      .filter(email => email); // Only valid emails

    if (emails.length === 0) {
      return res.status(400).json({ message: 'No valid email addresses found for selected patients' });
    }

    const { sendBulkCustomEmail } = await import('../utils/sendEmail.js');
    await sendBulkCustomEmail(emails, subject, message, pharmacyName);

    res.json({ message: `Successfully sent email to ${emails.length} patients` });
  } catch (error) {
    next(error);
  }
});

export default router;
