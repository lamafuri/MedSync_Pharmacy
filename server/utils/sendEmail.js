import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  });
  return transporter;
}

export function isEmailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

async function sendMail(mailOptions) {
  const tx = getTransporter();
  if (!tx) {
    const err = new Error('Email service is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.');
    err.statusCode = 503;
    throw err;
  }
  await tx.sendMail(mailOptions);
}

export const sendVerificationEmail = async (email, otp) => {
  await sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'MedSync Pharmacist Portal - Verify Your Email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1a2540 0%, #0f6e56 100%); padding: 30px; border-radius: 20px 20px 0 0;">
          <h1 style="color: white; margin: 0;">MedSync</h1>
          <p style="color: #e1f5ee; margin: 5px 0 0;">Pharmacist Portal</p>
        </div>
        <div style="background: #f4f7fb; padding: 30px; border-radius: 0 0 20px 20px;">
          <h2 style="color: #1a2540; margin-top: 0;">Verify Your Email</h2>
          <p style="color: #7c8fa6;">Your verification code is:</p>
          <div style="background: white; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #0f6e56; letter-spacing: 8px;">${otp}</span>
          </div>
          <p style="color: #7c8fa6; font-size: 14px;">This code will expire in 15 minutes.</p>
        </div>
      </div>
    `,
  });
};

export const sendResetOTPEmail = async (email, otp) => {
  await sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'MedSync Pharmacist Portal - Password Reset',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1a2540 0%, #0f6e56 100%); padding: 30px; border-radius: 20px 20px 0 0;">
          <h1 style="color: white; margin: 0;">MedSync</h1>
          <p style="color: #e1f5ee; margin: 5px 0 0;">Pharmacist Portal</p>
        </div>
        <div style="background: #f4f7fb; padding: 30px; border-radius: 0 0 20px 20px;">
          <h2 style="color: #1a2540; margin-top: 0;">Reset Your Password</h2>
          <p style="color: #7c8fa6;">Your password reset code is:</p>
          <div style="background: white; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #0f6e56; letter-spacing: 8px;">${otp}</span>
          </div>
          <p style="color: #7c8fa6; font-size: 14px;">This code will expire in 15 minutes.</p>
        </div>
      </div>
    `,
  });
};

export const sendOfferEmail = async ({ to, patientName, pharmacyName, offerTitle, offerMessage, medicineName, expiresAt }) => {
  await sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `Special Offer from ${pharmacyName} - ${offerTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1a2540 0%, #0f6e56 100%); padding: 30px; border-radius: 20px 20px 0 0;">
          <h1 style="color: white; margin: 0;">MedSync</h1>
          <p style="color: #e1f5ee; margin: 5px 0 0;">Pharmacist Portal</p>
        </div>
        <div style="background: #f4f7fb; padding: 30px; border-radius: 0 0 20px 20px;">
          <h2 style="color: #1a2540; margin-top: 0;">${offerTitle}</h2>
          <p style="color: #7c8fa6;">Dear ${patientName},</p>
          <p style="color: #1a2540;">${offerMessage}</p>
          <div style="background: #e1f5ee; padding: 15px; border-radius: 10px; margin: 20px 0;">
            <p style="color: #0f6e56; margin: 0;"><strong>Medicine:</strong> ${medicineName}</p>
            <p style="color: #0f6e56; margin: 5px 0 0;"><strong>From:</strong> ${pharmacyName}</p>
            <p style="color: #0f6e56; margin: 5px 0 0;"><strong>Expires:</strong> ${new Date(expiresAt).toLocaleDateString()}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}" style="background: #0f6e56; color: white; padding: 15px 40px; text-decoration: none; border-radius: 20px; font-weight: bold; display: inline-block;">View in MedSync</a>
          </div>
        </div>
      </div>
    `,
  });
};

export const sendBulkCustomEmail = async (emails, subject, message, pharmacyName) => {
  await sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    bcc: emails, // Use BCC to hide recipients from each other
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1a2540 0%, #0f6e56 100%); padding: 30px; border-radius: 20px 20px 0 0;">
          <h1 style="color: white; margin: 0;">MedSync</h1>
          <p style="color: #e1f5ee; margin: 5px 0 0;">${pharmacyName}</p>
        </div>
        <div style="background: #f4f7fb; padding: 30px; border-radius: 0 0 20px 20px;">
          <div style="color: #1a2540; font-size: 16px; line-height: 1.5; white-space: pre-wrap;">${message}</div>
          <div style="margin-top: 30px; border-top: 1px solid #e1f5ee; padding-top: 20px; color: #7c8fa6; font-size: 12px; text-align: center;">
            <p>This message was sent from ${pharmacyName} via MedSync Pharmacist Portal.</p>
          </div>
        </div>
      </div>
    `,
  });
};
