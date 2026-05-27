import cron from 'node-cron';
import PatientLink from '../models/PatientLink.js';
import Medicine from '../models/shared/Medicine.js';
import Notification from '../models/Notification.js';

// Helper function to calculate stock status
const calculateStockStatus = (medicine) => {
  const dailyUsage = medicine.frequencyPerDay * medicine.dosePerIntake;
  const daysLeft = Math.floor(medicine.currentStock / dailyUsage);
  
  if (daysLeft <= 3) return 'red';
  if (daysLeft <= medicine.refillThreshold) return 'amber';
  return 'green';
};

// Run daily at 3:15 UTC (9:00 AM NPT)
cron.schedule('15 3 * * *', async () => {
  // console.log('Running low stock alerts cron job...');
  
  try {
    // Fetch all PatientLinks
    const patientLinks = await PatientLink.find({});

    for (const link of patientLinks) {
      if (!link.notifyLowStock) continue;

      // Fetch active medicines for this patient
      const medicines = await Medicine.find({
        patientId: link.patientId,
        isActive: true,
      });

      // Check for red or amber status
      const criticalMedicines = medicines.filter(med => {
        const status = calculateStockStatus(med);
        return status === 'red' || status === 'amber';
      });

      if (criticalMedicines.length > 0) {
        // Create notification for pharmacist
        await Notification.create({
          recipientId: link.pharmacistId,
          recipientModel: 'Pharmacist',
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: `${criticalMedicines.length} medicine(s) need attention for a linked patient.`,
        });
      }
    }

    // console.log('Low stock alerts cron job completed.');
  } catch (error) {
    // console.error('Error in low stock alerts cron job:', error);
  }
});

// console.log('Low stock alerts cron job scheduled for 3:15 UTC daily.');
