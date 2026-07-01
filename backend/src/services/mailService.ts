import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

interface ISendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

let transporter: nodemailer.Transporter | null = null;

const getTransporter = (): nodemailer.Transporter => {
  if (transporter) return transporter;

  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT || 587,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  } else {
    // Return a dummy transporter that prints to console or use mock
    console.log('📬 SMTP details not configured. Email service running in console fallback mode.');
  }

  return transporter as nodemailer.Transporter;
};

export const sendEmail = async (options: ISendEmailOptions): Promise<void> => {
  const currentTransporter = getTransporter();

  if (currentTransporter) {
    await currentTransporter.sendMail({
      from: env.SMTP_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  } else {
    console.log(`
=========================================
📧 MOCK EMAIL SENT:
To:      ${options.to}
Subject: ${options.subject}
Content: 
${options.html.replace(/<[^>]*>/g, ' ')}
=========================================
    `);
  }
};

export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Verify Your FitTrack AI Account',
    html: `
      <h2>Welcome to FitTrack AI!</h2>
      <p>Thank you for registering. Please verify your email by clicking the link below:</p>
      <a href="${verifyUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  });
};

export const sendResetPasswordEmail = async (email: string, token: string): Promise<void> => {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Reset Your FitTrack AI Password',
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password. Please click the link below to set a new password:</p>
      <a href="${resetUrl}" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request this reset, please ignore this email and secure your account.</p>
    `,
  });
};
