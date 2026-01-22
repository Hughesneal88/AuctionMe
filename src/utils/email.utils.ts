import nodemailer from 'nodemailer';
import { config } from '../config';

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: {
      user: config.email.user,
      pass: config.email.password,
    },
  });
};

export const sendVerificationEmail = async (
  email: string,
  verificationToken: string
): Promise<void> => {
  const verificationUrl = `${config.urls.frontend}/verify-email?token=${verificationToken}`;
  
  const mailOptions = {
    from: config.email.from,
    to: email,
    subject: 'Verify Your Email - AuctionMe',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to AuctionMe!</h2>
        <p>Thank you for registering. Please verify your email address to complete your registration.</p>
        <p>Click the button below to verify your email:</p>
        <a href="${verificationUrl}" 
           style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
          Verify Email
        </a>
        <p>Or copy and paste this link into your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      </div>
    `,
  };

  const transporter = createTransporter();
  await transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string
): Promise<void> => {
  const resetUrl = `${config.urls.frontend}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: config.email.from,
    to: email,
    subject: 'Password Reset - AuctionMe',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Click the button below to reset it:</p>
        <a href="${resetUrl}" 
           style="display: inline-block; padding: 10px 20px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
        <p>Or copy and paste this link into your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, please ignore this email.</p>
      </div>
    `,
  };

  const transporter = createTransporter();
  await transporter.sendMail(mailOptions);
};
