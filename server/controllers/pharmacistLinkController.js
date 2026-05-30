import PharmacistLink from '../models/PharmacistLink.js';
import PharmacistInvitation from '../models/PharmacistInvitation.js';
import Patient from '../models/Patient.js';
import Medicine from '../models/Medicine.js';

// Link patient via OTP
export const linkViaOtp = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const pharmacistId = req.pharmacist._id;

    if (!otp || otp.length !== 8) {
      return res.status(400).json({ message: 'Invalid OTP format. OTP must be 8 digits.' });
    }

    // Find invitation with matching OTP that hasn't expired and hasn't been used
    const invitation = await PharmacistInvitation.findOne({
      otp: otp,
      expiresAt: { $gt: new Date() },
      otpUsed: false,
    });

    if (!invitation) {
      return res.status(400).json({ message: 'Invalid OTP or expired' });
    }

    const userId = invitation.userId;

    // Check if link already exists
    const existingLink = await PharmacistLink.findOne({ pharmacistId, userId });
    if (existingLink) {
      return res.status(400).json({ message: 'Already linked to this patient' });
    }

    // Mark OTP as used
    invitation.otpUsed = true;
    await invitation.save();

    // Create new link
    const link = await PharmacistLink.create({
      pharmacistId,
      userId,
      linkMethod: 'otp',
    });

    res.status(201).json({
      message: 'Successfully linked to patient',
      link: {
        id: link._id,
        userId: link.userId,
        linkedAt: link.linkedAt,
        linkMethod: link.linkMethod,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Link patient via QR token
export const linkViaQr = async (req, res, next) => {
  try {
    const { qrToken } = req.body;
    const pharmacistId = req.pharmacist._id;

    if (!qrToken) {
      return res.status(400).json({ message: 'QR token is required' });
    }

    // Find invitation with matching QR token that hasn't expired and hasn't been used
    const invitation = await PharmacistInvitation.findOne({
      qrToken: qrToken,
      expiresAt: { $gt: new Date() },
      qrUsed: false,
    });

    if (!invitation) {
      return res.status(400).json({ message: 'Invalid QR token or expired' });
    }

    const userId = invitation.userId;

    // Check if link already exists
    const existingLink = await PharmacistLink.findOne({ pharmacistId, userId });
    if (existingLink) {
      return res.status(400).json({ message: 'Already linked to this patient' });
    }

    // Mark QR as used
    invitation.qrUsed = true;
    await invitation.save();

    // Create new link
    const link = await PharmacistLink.create({
      pharmacistId,
      userId,
      linkMethod: 'qr',
    });

    res.status(201).json({
      message: 'Successfully linked to patient',
      link: {
        id: link._id,
        userId: link.userId,
        linkedAt: link.linkedAt,
        linkMethod: link.linkMethod,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all linked patients for a pharmacist
export const getLinkedPatients = async (req, res, next) => {
  try {
    const pharmacistId = req.pharmacist._id;

    const links = await PharmacistLink.find({ pharmacistId })
      .sort({ linkedAt: -1 });

    // For each linked user, fetch their patients and medicines
    const enrichedLinks = await Promise.all(
      links.map(async (link) => {
        try {
          const patients = await Patient.find({ userId: link.userId })
            .select('-pharmacyPin')
            .lean();

          const enrichedPatients = await Promise.all(
            patients.map(async (patient) => {
              const medicines = await Medicine.find({ patientId: patient._id, isActive: true })
                .lean();

              return {
                ...patient,
                medicines,
              };
            })
          );

          return {
            ...link.toObject(),
            patients: enrichedPatients,
          };
        } catch (error) {
          return link.toObject();
        }
      })
    );

    res.json(enrichedLinks);
  } catch (error) {
    next(error);
  }
};

// Unlink a patient
export const unlinkPatient = async (req, res, next) => {
  try {
    const { linkId } = req.params;
    const pharmacistId = req.pharmacist._id;

    const link = await PharmacistLink.findOne({ _id: linkId, pharmacistId });
    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }

    await PharmacistLink.deleteOne({ _id: linkId });

    res.json({ message: 'Successfully unlinked patient' });
  } catch (error) {
    next(error);
  }
};
