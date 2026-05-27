import express from 'express';
import { body, validationResult } from 'express-validator';
import PatientLink from '../models/PatientLink.js';
import Patient from '../models/shared/Patient.js';
import Offer from '../models/Offer.js';
import Notification from '../models/Notification.js';
import { sendOfferEmail } from '../utils/sendEmail.js';

const router = express.Router();

// POST /api/offers
router.post('/', [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('medicineName').trim().notEmpty().withMessage('Medicine name is required'),
  body('offerType').isIn(['discount', 'buy2get1', 'bundle', 'custom']).withMessage('Invalid offer type'),
  body('discountPercent').optional().isInt({ min: 0, max: 100 }).withMessage('Discount must be 0-100'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('fullMessage').trim().notEmpty().withMessage('Message is required'),
  body('channels').isArray().withMessage('Channels must be an array'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { patientId, medicineName, offerType, discountPercent, title, description, fullMessage, shortMessage, channels, expiresAt } = req.body;
    const pharmacistId = req.pharmacist._id;

    // Premium gate for email sending
    if (!req.pharmacist.isPremium && channels.includes('email')) {
      return res.status(403).json({
        message: 'Email sending requires Premium subscription.',
        feature: 'email_send'
      });
    }

    // Filter out whatsapp channel (not implemented yet)
    const filteredChannels = channels.filter(c => c !== 'whatsapp');

    // Verify PatientLink exists
    const patientLink = await PatientLink.findOne({
      pharmacistId,
      patientId,
    });

    if (!patientLink) {
      return res.status(404).json({ message: 'Patient not linked to this pharmacist' });
    }

    // Fetch patient details
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Create offer with draft status
    const offer = await Offer.create({
      pharmacistId,
      patientId,
      medicineName,
      offerType,
      discountPercent: discountPercent || 0,
      title,
      description,
      fullMessage,
      shortMessage,
      channels: filteredChannels,
      expiresAt: expiresAt || null,
      status: 'draft',
    });

    // Send through each channel
    for (const channel of filteredChannels) {
      if (channel === 'email' && patientLink.patientEmail) {
        await sendOfferEmail({
          to: patientLink.patientEmail,
          patientName: patient.name,
          pharmacyName: req.pharmacist.pharmacyName,
          offerTitle: title,
          offerMessage: fullMessage,
          medicineName,
          expiresAt: expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
      } else if (channel === 'sms') {
        // SMS stub — integrate Twilio later (no sensitive logging)
        // console.log(`SMS sent to ${patientLink.patientPhone}: ${title} - ${shortMessage}`);
      } else if (channel === 'in_app') {
        // Create in-app notification for patient with new fields
        await Notification.create({
          recipientId: patientId,
          recipientModel: 'Patient',
          type: 'offer',
          title,
          message: shortMessage || fullMessage,
          offerId: offer._id,
          pharmacyName: req.pharmacist.pharmacyName,
          pharmacyAddress: req.pharmacist.pharmacyAddress || '',
          pharmacyPhone: req.pharmacist.phone || '',
          offerTitle: title,
          offerMessage: fullMessage,
          medicineName: medicineName,
          discountPercent: discountPercent || 0,
          offerType: offerType,
          expiresAt: expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
      }
    }

    // Update offer status to sent
    offer.status = 'sent';
    offer.sentAt = new Date();
    await offer.save();

    res.status(201).json(offer);
  } catch (error) {
    next(error);
  }
});

// GET /api/offers
router.get('/', async (req, res, next) => {
  try {
    const pharmacistId = req.pharmacist._id;
    const { patientId, status, page = 1, limit = 20 } = req.query;

    const query = { pharmacistId };
    if (patientId) query.patientId = patientId;
    if (status) query.status = status;

    const offers = await Offer.find(query)
      .populate('patientId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Offer.countDocuments(query);

    res.json({
      offers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/offers/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const pharmacistId = req.pharmacist._id;

    const offer = await Offer.findOne({ _id: id, pharmacistId });
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    if (offer.status === 'draft') {
      // Hard delete draft offers
      await Offer.deleteOne({ _id: id });
    } else {
      // Soft delete sent offers by setting to expired
      offer.status = 'expired';
      await offer.save();
    }

    res.json({ message: 'Offer deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/offers/generate-template
router.post('/generate-template', [
  body('medicineName').trim().notEmpty().withMessage('Medicine name is required'),
  body('offerType').isIn(['discount', 'buy2get1', 'bundle', 'custom']).withMessage('Invalid offer type'),
  body('discountPercent').optional().isInt({ min: 0, max: 100 }).withMessage('Discount must be 0-100'),
  body('patientName').trim().notEmpty().withMessage('Patient name is required'),
  body('patientPreferences').optional().trim(),
  body('daysLeft').optional().isInt({ min: 0 }),
  body('additionalNotes').optional().trim(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      medicineName, 
      offerType, 
      discountPercent, 
      patientName,
      patientPreferences,
      daysLeft,
      additionalNotes
    } = req.body;
    const pharmacyName = req.pharmacist.pharmacyName;

    if (!req.pharmacist.isPremium) {
      return res.status(403).json({
        message: 'Premium required',
        upgradeUrl: '/upgrade',
      });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}` 
        },
        body: JSON.stringify({
          model: "deepseek-r1-distill-llama-70b",
          max_tokens: 800,
          temperature: 0.7,
          messages: [
            {
              role: "system",
              content: "You are a pharmacy marketing assistant in Nepal. Always respond with valid JSON only. No markdown, no explanation, no code blocks. Raw JSON only."
            },
            {
              role: "user",
              content: `Generate a personalized medicine offer message for:
              Pharmacy: ${pharmacyName}
              Medicine: ${medicineName}
              Patient Name: ${patientName}
              Patient Preferences: ${patientPreferences || 'N/A'}
              Offer Type: ${offerType}
              Discount: ${discountPercent}%
              Days of stock remaining: ${daysLeft || 'N/A'}
              Additional Notes: ${additionalNotes || 'N/A'}
              
              Return JSON with exactly these keys:
              {
                "emailSubject": "compelling subject line",
                "emailBody": "professional full email body HTML, personalized with patient name and medicine details, 3-4 sentences",
                "whatsappMessage": "friendly WhatsApp message under 300 chars with emoji",
                "suggestedDiscount": number between 5 and 40,
                "urgencyLevel": "low | medium | high"
              }`
            }
          ]
        })
      }
    );

    const data = await response.json();
    const text = data.choices[0].message.content;
    const parsed = JSON.parse(text.trim());

    res.json({ template: parsed });
  } catch (error) {
    // console.error('AI generation error:', error);
    return res.status(500).json({ 
      message: 'AI generation failed, please write message manually' 
    });
  }
});

// GET /api/offers/analytics
router.get('/analytics', async (req, res, next) => {
  try {
    const pharmacistId = req.pharmacist._id;

    if (!req.pharmacist.isPremium) {
      return res.status(403).json({
        message: 'Premium required',
        upgradeUrl: '/upgrade',
      });
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const offersThisWeek = await Offer.countDocuments({
      pharmacistId,
      status: 'sent',
      sentAt: { $gte: weekAgo },
    });

    const offersThisMonth = await Offer.countDocuments({
      pharmacistId,
      status: 'sent',
      sentAt: { $gte: monthAgo },
    });

    const totalSent = await Offer.countDocuments({
      pharmacistId,
      status: 'sent',
    });

    const acceptedCount = await Offer.countDocuments({
      pharmacistId,
      status: 'accepted',
    });

    const acceptanceRate = totalSent > 0 ? (acceptedCount / totalSent) * 100 : 0;

    // Top medicines
    const topMedicines = await Offer.aggregate([
      { $match: { pharmacistId } },
      { $group: { _id: '$medicineName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { name: '$_id', count: 1, _id: 0 } },
    ]);

    // Offers by type
    const offersByType = await Offer.aggregate([
      { $match: { pharmacistId } },
      { $group: { _id: '$offerType', count: { $sum: 1 } } },
      { $project: { type: '$_id', count: 1, _id: 0 } },
    ]);

    const offersByTypeMap = {};
    offersByType.forEach(item => {
      offersByTypeMap[item.type] = item.count;
    });

    // Patient engagement (last 30 days)
    const patientEngagement = await Offer.aggregate([
      {
        $match: {
          pharmacistId,
          sentAt: { $gte: monthAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$sentAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } },
    ]);

    res.json({
      offersThisWeek,
      offersThisMonth,
      acceptanceRate: Math.round(acceptanceRate * 10) / 10,
      topMedicines,
      offersByType: offersByTypeMap,
      patientEngagement,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
