import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

const initEmailService = () => {
  const emailConfig = {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  };

  transporter = nodemailer.createTransport(emailConfig);
};

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  if (!transporter) {
    initEmailService();
  }

  if (!transporter) {
    console.error('Email service not configured');
    return;
  }

  // Build the reset link - adjust the frontend URL based on your deployment
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Request - Optical Shop Orders',
    html: `
      <h2>Password Reset Request</h2>
      <p>Hello,</p>
      <p>You have requested to reset your password. Click the button below to reset it:</p>
      <p>
        <a href="${resetLink}" style="background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
      </p>
      <p>Or copy and paste this link in your browser:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <p>Best regards,<br/>Optical Shop Orders Team</p>
    `,
    text: `
      Password Reset Request

      Hello,

      You have requested to reset your password. Visit this link to reset it:
      ${resetLink}

      This link will expire in 1 hour.

      If you didn't request this, you can safely ignore this email.

      Best regards,
      Optical Shop Orders Team
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
};

export { initEmailService };
