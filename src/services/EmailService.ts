import nodemailer from 'nodemailer';
import { EmailOptions } from '../types';

/**
 * Service for sending email notifications (optional)
 */
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private enabled: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Check if email configuration is available
    const emailConfig = {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    };

    if (emailConfig.host && emailConfig.auth.user && emailConfig.auth.pass) {
      this.transporter = nodemailer.createTransport(emailConfig);
      this.enabled = true;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.enabled || !this.transporter) {
      console.log('Email service not configured, skipping email:', options.subject);
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@auctionme.com',
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html || options.text,
      });
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendBidNotification(email: string, auctionTitle: string, amount: number): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'New Bid Placed on Your Auction',
      text: `A new bid of $${amount} was placed on your auction: ${auctionTitle}`,
      html: `<p>A new bid of <strong>$${amount}</strong> was placed on your auction: <strong>${auctionTitle}</strong></p>`,
    });
  }

  async sendDeliveryCodeEmail(email: string, code: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Your Delivery Code',
      text: `Your delivery code is: ${code}. Please provide this code to the seller upon delivery.`,
      html: `<p>Your delivery code is: <strong>${code}</strong></p><p>Please provide this code to the seller upon delivery.</p>`,
    });
  }

  async sendSecurityAlert(email: string, reason: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Security Alert - AuctionMe',
      text: `Security Alert: ${reason}`,
      html: `<p><strong>Security Alert:</strong> ${reason}</p>`,
    });
  }
}

export const emailService = new EmailService();
