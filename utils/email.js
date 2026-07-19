import axios from 'axios';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { env } from '../lib/config';
import { logger } from './logger';

/**
 * Email utility for sending emails
 * 
 * Supports three providers (in order of priority):
 * 1. Resend (requires RESEND_API_KEY) - Recommended for development
 * 2. SMTP2Go REST API (requires SMTP2GO_API_KEY)
 * 3. SMTP Protocol (requires SMTP_USERNAME, SMTP_PASSWORD, SMTP_HOST, SMTP_PORT)
 * 
 * Environment variables:
 * - RESEND_API_KEY: Your Resend API key (preferred for development)
 * - RESEND_FROM_EMAIL: The sender email address for Resend
 * - SMTP2GO_API_KEY: Your SMTP2Go API key (for REST API)
 * - SMTP2GO_FROM_EMAIL: The sender email address
 * - SMTP2GO_FROM_NAME: The sender name (optional)
 * - SMTP_USERNAME: SMTP username (for SMTP protocol)
 * - SMTP_PASSWORD: SMTP password (for SMTP protocol)
 * - SMTP_HOST: SMTP host (defaults to mail.smtp2go.com)
 * - SMTP_PORT: SMTP port (defaults to 25)
 * - SMTP_SECURE: Use SSL/TLS (defaults to false)
 */

const SMTP2GO_API_URL = 'https://api.smtp2go.com/v3/email/send';

/**
 * Send email using Resend API (recommended for development)
 */
async function sendEmailViaResend({ to, subject, htmlBody, textBody, from, fromName }) {
  const apiKey = env.RESEND_API_KEY;
  const defaultFrom = env.RESEND_FROM_EMAIL || env.SMTP_FROM;
  const defaultFromName = env.RESEND_FROM_NAME || 'The Server';

  if (!apiKey || apiKey.trim() === '') {
    logger.error('RESEND_API_KEY is not configured. Check your .env file.');
    throw new Error('RESEND_API_KEY is not configured. Please add it to your .env or .env.local file.');
  }

  if (!defaultFrom || defaultFrom.trim() === '') {
    logger.error('RESEND_FROM_EMAIL is not configured. Check your .env file.');
    throw new Error('RESEND_FROM_EMAIL is not configured. Please add it to your .env or .env.local file.');
  }

  // Normalize 'to' to array
  const recipients = Array.isArray(to) ? to : [to];

  // Validate recipients
  if (recipients.length === 0) {
    throw new Error('At least one recipient email is required');
  }

  const resend = new Resend(apiKey);

  try {
    if (process.env.NODE_ENV === 'development') {
      logger.info(`Sending email via Resend to: ${recipients.join(', ')}`);
    }
    
    const { data, error } = await resend.emails.send({
      from: fromName 
        ? `${fromName} <${from || defaultFrom}>` 
        : (from || defaultFrom),
      to: recipients,
      subject: subject,
      html: htmlBody,
      ...(textBody && { text: textBody }),
    });

    if (error) {
      throw new Error(error.message || 'Resend API error');
    }

    if (data && data.id) {
      if (process.env.NODE_ENV === 'development') {
        logger.info(`Email sent successfully via Resend. Message ID: ${data.id}`);
      }
      return {
        success: true,
        messageId: data.id,
        data: data,
      };
    }

    throw new Error('Unexpected response format from Resend');
  } catch (error) {
    logger.error('Failed to send email via Resend:', error.message);
    
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      throw new Error('Resend API authentication failed - Check your RESEND_API_KEY');
    } else if (error.message.includes('422') || error.message.includes('validation')) {
      throw new Error('Resend validation error - Verify your RESEND_FROM_EMAIL is verified in Resend dashboard');
    }
    
    throw new Error(`Failed to send email via Resend: ${error.message}`);
  }
}

/**
 * Send email using SMTP protocol (fallback when API key is not available)
 */
async function sendEmailViaSMTP({ to, subject, htmlBody, textBody, from, fromName }) {
  const smtpHost = env.SMTP_HOST || 'mail.smtp2go.com';
  const smtpPort = parseInt(env.SMTP_PORT || '25', 10);
  const smtpUsername = env.SMTP_USERNAME;
  const smtpPassword = env.SMTP_PASSWORD;
  const smtpSecure = env.SMTP_SECURE || false;
  const defaultFrom = env.SMTP_FROM;
  const defaultFromName = 'The Server';

  if (!smtpUsername || smtpUsername.trim() === '' || !smtpPassword || smtpPassword.trim() === '') {
    logger.error('SMTP_USERNAME and SMTP_PASSWORD are required for SMTP protocol. Check your .env file.');
    throw new Error('SMTP_USERNAME and SMTP_PASSWORD are required for SMTP protocol. Please add them to your .env or .env.local file.');
  }

  if (!defaultFrom || defaultFrom.trim() === '') {
    logger.error('SMTP_FROM is not configured. Check your .env file.');
    throw new Error('SMTP_FROM is not configured. Please add it to your .env or .env.local file.');
  }

  // Create transporter with timeout configuration
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure, // true for 465, false for other ports
    auth: {
      user: smtpUsername,
      pass: smtpPassword,
    },
    connectionTimeout: 10000, // 10 seconds to establish connection
    socketTimeout: 10000, // 10 seconds for socket operations
    greetingTimeout: 10000, // 10 seconds for SMTP greeting
  });

  // Normalize 'to' to array
  const recipients = Array.isArray(to) ? to : [to];

  // Send email
  const mailOptions = {
    from: fromName 
      ? `${fromName} <${from || defaultFrom}>` 
      : (from || defaultFrom),
    to: recipients.join(', '),
    subject: subject,
    html: htmlBody,
    text: textBody || htmlBody.replace(/<[^>]*>/g, ''), // Strip HTML if no text body
  };

  // Send with timeout wrapper
  const sendPromise = transporter.sendMail(mailOptions);
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('SMTP send timeout after 10 seconds')), 10000)
  );
  
  const info = await Promise.race([sendPromise, timeoutPromise]);
  
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    logger.info(`Email sent via SMTP to: ${recipients.join(', ')}, Message ID: ${info.messageId}`);
  }
  
  return {
    success: true,
    messageId: info.messageId,
    data: info,
  };
}

/**
 * Send email using SMTP2Go REST API
 */
async function sendEmailViaAPI({ to, subject, htmlBody, textBody, from, fromName }) {
  const apiKey = env.SMTP2GO_API_KEY;
  // Fall back to SMTP_FROM if SMTP2GO_FROM_EMAIL is not set
  const defaultFrom = env.SMTP2GO_FROM_EMAIL || env.SMTP_FROM;
  const defaultFromName = env.SMTP2GO_FROM_NAME || 'The Server';

  if (!apiKey || apiKey.trim() === '') {
    logger.error('SMTP2GO_API_KEY is not configured. Check your .env file.');
    throw new Error('SMTP2GO_API_KEY is not configured. Please add it to your .env or .env.local file.');
  }

  if (!defaultFrom || defaultFrom.trim() === '') {
    logger.error('SMTP2GO_FROM_EMAIL or SMTP_FROM is not configured. Check your .env file.');
    throw new Error('SMTP2GO_FROM_EMAIL (or SMTP_FROM as fallback) is not configured. Please add it to your .env or .env.local file.');
  }

  // Normalize 'to' to array
  const recipients = Array.isArray(to) ? to : [to];

  // Validate recipients
  if (recipients.length === 0) {
    throw new Error('At least one recipient email is required');
  }

  const emailData = {
    api_key: apiKey,
    to: recipients,
    sender: from || defaultFrom,
    subject: subject,
    html_body: htmlBody,
    ...(textBody && { text_body: textBody }),
    ...(fromName || defaultFromName ? { sender_name: fromName || defaultFromName } : {}),
  };

  try {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      logger.info(`Sending email via API to: ${recipients.join(', ')}`);
    }
    const response = await axios.post(SMTP2GO_API_URL, emailData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout to prevent hanging
    });

    // SMTP2Go API returns { data: { email_id: "...", ... } } on success
    if (response.data) {
      if (response.data.data && response.data.data.email_id) {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          logger.info(`Email sent successfully. Message ID: ${response.data.data.email_id}`);
        }
        return {
          success: true,
          messageId: response.data.data.email_id,
          data: response.data.data,
        };
      }
      // Sometimes the response structure might be slightly different
      if (response.data.email_id) {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          logger.info(`Email sent successfully. Message ID: ${response.data.email_id}`);
        }
        return {
          success: true,
          messageId: response.data.email_id,
          data: response.data,
        };
      }
    }

    throw new Error('Unexpected response format from SMTP2Go');
  } catch (error) {
    logger.error('Failed to send email via API:', error.response?.data || error.message);
    
    if (error.response) {
      // SMTP2Go API error - extract meaningful error message
      const errorData = error.response.data;
      let errorMessage = 'SMTP2Go API error';
      
      if (errorData?.data?.error) {
        errorMessage = errorData.data.error;
      } else if (errorData?.error) {
        errorMessage = errorData.error;
      } else if (errorData?.error_code) {
        errorMessage = `SMTP2Go error (${errorData.error_code}): ${errorData.error || 'Unknown error'}`;
      } else {
        errorMessage = `SMTP2Go API error: ${error.response.status} ${error.response.statusText || ''}`;
      }
      
      // Add helpful context for common errors
      if (error.response.status === 401) {
        errorMessage += ' - Check your SMTP2GO_API_KEY';
      } else if (error.response.status === 400) {
        errorMessage += ' - Verify your SMTP2GO_FROM_EMAIL is verified in SMTP2Go dashboard';
      }
      
      throw new Error(errorMessage);
    }
    
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

export async function sendEmail({
  to,
  subject,
  htmlBody,
  textBody,
  from,
  fromName,
}) {

  // Try Resend first (recommended for development)
  if (env.RESEND_API_KEY && env.RESEND_API_KEY.trim() !== '') {
    try {
      return await sendEmailViaResend({ to, subject, htmlBody, textBody, from, fromName });
    } catch (error) {
      logger.warn('Resend failed, falling back to SMTP2Go:', error.message);
      // Fall through to SMTP2Go if Resend fails
    }
  }

  // Try SMTP2Go REST API if Resend is not available or failed
  if (env.SMTP2GO_API_KEY && env.SMTP2GO_API_KEY.trim() !== '') {
    try {
      return await sendEmailViaAPI({ to, subject, htmlBody, textBody, from, fromName });
    } catch (error) {
      logger.warn('SMTP2Go API failed, falling back to SMTP:', error.message);
      // Fall through to SMTP if API fails
    }
  }

  // Fall back to SMTP protocol if other methods are not available or failed
  if (env.SMTP_USERNAME && env.SMTP_USERNAME.trim() !== '' &&
      env.SMTP_PASSWORD && env.SMTP_PASSWORD.trim() !== '') {
    return await sendEmailViaSMTP({ to, subject, htmlBody, textBody, from, fromName });
  }

  // If no method is configured, throw helpful error with debug info
  const errorMsg =
    'Email configuration missing. Please configure one of the following:\n' +
    '1. RESEND_API_KEY (recommended for development), or\n' +
    '2. SMTP2GO_API_KEY (for REST API), or\n' +
    '3. SMTP_USERNAME and SMTP_PASSWORD (for SMTP protocol)\n\n' +
    'Current status:\n' +
    `- RESEND_API_KEY: ${env.RESEND_API_KEY ? 'Set' : 'NOT SET'}\n` +
    `- SMTP2GO_API_KEY: ${env.SMTP2GO_API_KEY ? 'Set' : 'NOT SET'}\n` +
    `- SMTP_USERNAME: ${env.SMTP_USERNAME ? 'Set' : 'NOT SET'}\n` +
    `- SMTP_PASSWORD: ${env.SMTP_PASSWORD ? 'Set' : 'NOT SET'}\n` +
    `- SMTP_FROM: ${env.SMTP_FROM ? 'Set' : 'NOT SET'}\n` +
    `- SMTP2GO_FROM_EMAIL: ${env.SMTP2GO_FROM_EMAIL || 'NOT SET'}\n` +
    `- RESEND_FROM_EMAIL: ${env.RESEND_FROM_EMAIL || 'NOT SET'}\n\n` +
    'Please check your .env or .env.local file and restart the server.';

  logger.error('Email configuration error:', errorMsg);
  throw new Error(errorMsg);
}

/**
 * Send email asynchronously without blocking (fire and forget)
 * Logs errors but doesn't throw - useful for non-critical emails
 * @param {Function} emailFn - Function that returns a promise for sending email
 * @param {string} context - Context for logging (e.g., 'signup', 'verification')
 * @returns {void} Returns immediately, email sends in background
 */
export function sendEmailAsync(emailFn, context = 'email') {
  // Execute email sending in background without blocking
  Promise.resolve()
    .then(() => emailFn())
    .then((result) => {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        logger.info(`[${context}] Email sent successfully in background`, {
          messageId: result?.messageId,
          timestamp: new Date().toISOString(),
        });
      }
    })
    .catch((error) => {
      // Always log errors - these are important for production debugging
      logger.error(`[${context}] Background email sending failed:`, {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    });
  
  // Return immediately - email is being sent in background
}

/**
 * Send OTP verification email
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @param {string} [userName] - User's name (optional)
 * @returns {Promise<Object>} Response from sendEmail
 */
export async function sendOTPEmail(email, otp, userName = null) {
  const subject = 'Verify Your Email Address';
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
        <h2 style="color: #333; margin-top: 0;">Email Verification</h2>
        ${userName ? `<p>Hello ${userName},</p>` : '<p>Hello,</p>'}
        <p>Thank you for signing up! Please use the following code to verify your email address:</p>
        <div style="background-color: #fff; border: 2px dashed #333; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
          <h1 style="color: #333; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't create an account, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="font-size: 12px; color: #777;">This is an automated message, please do not reply.</p>
      </div>
    </body>
    </html>
  `;

  const textBody = `
Email Verification

${userName ? `Hello ${userName},` : 'Hello,'}

Thank you for signing up! Please use the following code to verify your email address:

${otp}

This code will expire in 10 minutes.

If you didn't create an account, please ignore this email.

---
This is an automated message, please do not reply.
  `;

  return sendEmail({
    to: email,
    subject,
    htmlBody,
    textBody,
  });
}

/**
 * Send welcome email after successful verification
 * @param {string} email - Recipient email
 * @param {string} userName - User's name
 * @returns {Promise<Object>} Response from sendEmail
 */
export async function sendWelcomeEmail(email, userName) {
  const subject = 'Welcome! Your Email Has Been Verified';
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome</title>
    </head>
    <body style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0; background-color: #f5f5f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center" style="padding: 0;">
            <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border-collapse: collapse;">
              <!-- Main Content -->
              <tr>
                <td style="padding: 50px 40px;">
                  <p style="color: #333333; font-size: 16px; margin: 0 0 24px 0; line-height: 1.7;">
                    Hello ${userName},
                  </p>
                  
                  <p style="color: #333333; font-size: 16px; margin: 0 0 24px 0; line-height: 1.7;">
                    Your email has been verified. Your account is now active and ready to use.
                  </p>
                  
                  <p style="color: #333333; font-size: 16px; margin: 0 0 40px 0; line-height: 1.7;">
                    You can now log in and start using all the features available to you.
                  </p>
                  
                  <!-- Services Section -->
                  <div style="background-color: #f9f9f9; border: 1px solid #e0e0e0; padding: 30px; margin: 40px 0;">
                    <p style="color: #333333; font-size: 16px; margin: 0 0 20px 0; line-height: 1.7;">
                      If you need assistance with website development, programming, app development, deployment, SEO, or email marketing, I'm available to help.
                    </p>
                    
                    <!-- Links Section -->
                    <p style="color: #333333; font-size: 15px; margin: 0 0 16px 0; line-height: 1.7;">
                      You can find me on:
                    </p>
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0;">
                          <a href="https://www.fiverr.com/s/EgQz3ey" style="color: #0066cc; text-decoration: underline; font-size: 15px;">Fiverr</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <a href="https://www.upwork.com/freelancers/~015f09e4ce1f66527f?p=1804023285153173504" style="color: #0066cc; text-decoration: underline; font-size: 15px;">Upwork</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <a href="https://designndev.com/" style="color: #0066cc; text-decoration: underline; font-size: 15px;">designndev.com</a>
                        </td>
                      </tr>
                    </table>
                  </div>
                  
                  <p style="color: #666666; font-size: 15px; margin: 40px 0 0 0; line-height: 1.7;">
                    If you have any questions, feel free to reach out.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9f9f9; padding: 30px 40px; border-top: 1px solid #e0e0e0;">
                  <p style="color: #999999; font-size: 13px; margin: 0; line-height: 1.6;">
                    This is an automated message. Please do not reply.<br>
                    © ${new Date().getFullYear()} Design & Dev. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const textBody = `
Hello ${userName},

Your email has been verified. Your account is now active and ready to use.

You can now log in and start using all the features available to you.

If you need assistance with website development, programming, app development, deployment, SEO, or email marketing, I'm available to help.

You can find me on:
- Fiverr: https://www.fiverr.com/s/EgQz3ey
- Upwork: https://www.upwork.com/freelancers/~015f09e4ce1f66527f?p=1804023285153173504
- designndev.com: https://designndev.com/

If you have any questions, feel free to reach out.

---
This is an automated message. Please do not reply.
© ${new Date().getFullYear()} Design & Dev. All rights reserved.
  `;

  return sendEmail({
    to: email,
    subject,
    htmlBody,
    textBody,
  });
}

/**
 * Theme colors for Valentine email (inline-safe for email clients)
 * Keys: theme_color (e.g. classic_rose) -> { bg, primary, border }
 */
const VALENTINE_EMAIL_THEMES = {
  classic_rose: { bg: '#fef2f2', primary: '#be123c', border: '#fecaca' },
  classic_crimson: { bg: '#450a0a', primary: '#fecaca', border: '#991b1b' },
  classic_blush: { bg: '#fff1f2', primary: '#db2777', border: '#fbcfe8' },
  classic_gold: { bg: '#fffbeb', primary: '#b45309', border: '#fde68a' },
  classic_lavender: { bg: '#f5f3ff', primary: '#6d28d9', border: '#c4b5fd' },
  classic_coral: { bg: '#fff7ed', primary: '#c2410c', border: '#fed7aa' },
  romantic_rose: { bg: '#fdf2f8', primary: '#9d174d', border: '#f9a8d4' },
  romantic_crimson: { bg: '#7f1d1d', primary: '#fecaca', border: '#b91c1c' },
  romantic_blush: { bg: '#fce7f3', primary: '#be185d', border: '#f9a8d4' },
  romantic_gold: { bg: '#fef9c3', primary: '#a16207', border: '#fcd34d' },
  romantic_lavender: { bg: '#ede9fe', primary: '#5b21b6', border: '#c4b5fd' },
  romantic_coral: { bg: '#ffedd5', primary: '#c2410c', border: '#fdba74' },
  minimal_rose: { bg: '#ffffff', primary: '#e11d48', border: '#fecaca' },
  minimal_crimson: { bg: '#fafafa', primary: '#b91c1c', border: '#fecaca' },
  minimal_blush: { bg: '#fffbff', primary: '#db2777', border: '#fce7f3' },
  minimal_gold: { bg: '#fffbeb', primary: '#b45309', border: '#fef3c7' },
  minimal_lavender: { bg: '#faf5ff', primary: '#6d28d9', border: '#ede9fe' },
  minimal_coral: { bg: '#fff7ed', primary: '#c2410c', border: '#ffedd5' },
  vintage_rose: { bg: '#fefce8', primary: '#a16207', border: '#fef3c7' },
  vintage_crimson: { bg: '#292524', primary: '#fecaca', border: '#57534e' },
  vintage_blush: { bg: '#fefce8', primary: '#9d174d', border: '#fef3c7' },
  vintage_gold: { bg: '#fefce8', primary: '#92400e', border: '#fde68a' },
  vintage_lavender: { bg: '#faf5ff', primary: '#5b21b6', border: '#ede9fe' },
  vintage_coral: { bg: '#fff7ed', primary: '#9a3412', border: '#ffedd5' },
  blush_rose: { bg: '#fff1f2', primary: '#be123c', border: '#fda4af' },
  blush_crimson: { bg: '#fef2f2', primary: '#b91c1c', border: '#fca5a5' },
  blush_blush: { bg: '#fdf2f8', primary: '#9d174d', border: '#f9a8d4' },
  blush_gold: { bg: '#fefce8', primary: '#a16207', border: '#fde047' },
  blush_lavender: { bg: '#f5f3ff', primary: '#5b21b6', border: '#a78bfa' },
  blush_coral: { bg: '#fff7ed', primary: '#c2410c', border: '#fdba74' },
};

function getValentineEmailTheme(theme, themeColor) {
  const key = `${theme || 'classic'}_${themeColor || 'rose'}`;
  return VALENTINE_EMAIL_THEMES[key] || VALENTINE_EMAIL_THEMES.classic_rose;
}

function parseEmailThemeKey(emailThemeKey) {
  if (!emailThemeKey || typeof emailThemeKey !== 'string') return { theme: 'classic', themeColor: 'rose' };
  const parts = emailThemeKey.trim().split('_');
  if (parts.length >= 2) return { theme: parts[0], themeColor: parts[1] };
  return { theme: 'classic', themeColor: 'rose' };
}

/**
 * Send Valentine link email to recipient
 * @param {string} to - Recipient email
 * @param {Object} opts - { recipientName, linkUrl, theme, themeColor, emailTheme?, subject?, body? }
 * @returns {Promise<Object>} Response from sendEmail
 */
export async function sendValentineLinkEmail(to, { recipientName, linkUrl, theme, themeColor, emailTheme, subject: customSubject, body: customBody }) {
  const themeKey = emailTheme || (theme && themeColor ? `${theme}_${themeColor}` : null);
  const { theme: t, themeColor: c } = themeKey ? parseEmailThemeKey(themeKey) : { theme: theme || 'classic', themeColor: themeColor || 'rose' };
  const themeStyles = getValentineEmailTheme(t, c);
  const isDark = t === 'vintage' && c === 'crimson';
  const textColor = isDark ? '#fef2f2' : '#1f2937';
  const mutedColor = isDark ? '#d6d3d1' : '#6b7280';
  // Neutral subject line to improve deliverability (avoid spam triggers)
  const defaultSubject = recipientName && recipientName.trim()
    ? `Private message for ${recipientName.trim()}`
    : 'You have a private message';
  const subject = customSubject && customSubject.trim() ? customSubject.trim() : defaultSubject;
  const defaultIntro = 'Use the link below to open your message. This link is only for you.';
  const introParagraph = customBody && customBody.trim() ? customBody.trim() : defaultIntro;
  const introEscaped = introParagraph.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, '<br />');
  // Use a neutral accent (blue) for the decorative dot to reduce spam scoring; theme colors still apply to CTA button
  const accentColor = '#4f46e5';

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</title>
    </head>
    <body style="margin:0; padding:0; font-family: Arial, Helvetica, sans-serif; background-color: ${themeStyles.bg};">
      <table role="presentation" style="width:100%; border-collapse: collapse; background-color: ${themeStyles.bg}; padding: 32px 16px;">
        <tr>
          <td align="center" style="padding: 24px 0;">
            <table role="presentation" style="max-width: 480px; width:100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border: 1px solid ${themeStyles.border};">
              <tr>
                <td style="padding: 40px 32px; text-align: center;">
                  <p style="font-size: 32px; margin: 0 0 16px 0; line-height: 1;"><span style="display: inline-block; width: 28px; height: 28px; background-color: ${accentColor}; border-radius: 50%;"></span></p>
                  <h1 style="color: ${textColor}; font-size: 22px; font-weight: 700; margin: 0 0 8px 0;">You have a private message</h1>
                  ${recipientName ? `<p style="color: ${mutedColor}; font-size: 16px; margin: 0 0 24px 0;">For ${recipientName}</p>` : ''}
                  <p style="color: ${mutedColor}; font-size: 15px; margin: 0 0 24px 0; line-height: 1.5;">${introEscaped}</p>
                  <a href="${linkUrl.replace(/&/g, '&amp;')}" style="display: inline-block; background-color: ${themeStyles.primary}; color: ${themeStyles.primary === '#fecaca' || themeStyles.primary === '#fca5a5' ? '#1f2937' : '#ffffff'}; text-decoration: none; font-weight: 600; font-size: 16px; padding: 14px 28px; border-radius: 9999px; margin: 8px 0;">Open your message</a>
                  <p style="color: ${mutedColor}; font-size: 13px; margin: 24px 0 0 0;">If the button does not work, copy and paste this link into your browser:</p>
                  <p style="color: ${mutedColor}; font-size: 12px; margin: 8px 0 0 0; word-break: break-all;">${linkUrl.replace(/&/g, '&amp;')}</p>
                </td>
              </tr>
              <tr>
                <td style="background-color: ${themeStyles.bg}; padding: 20px 32px; border-top: 1px solid ${themeStyles.border};">
                  <p style="color: ${mutedColor}; font-size: 12px; margin: 0; line-height: 1.5;">This link is private. Do not share it with others.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const textBody = (customBody && customBody.trim()
    ? customBody.trim() + '\n\n'
    : 'You have a private message' + (recipientName ? ` for ${recipientName}` : '') + '.\n\n') +
    'Use the link below to open your message (this link is only for you):\n\n' +
    linkUrl + '\n\n' +
    'This link is private. Do not share it with others.';

  return sendEmail({
    to,
    subject,
    htmlBody,
    textBody,
  });
}

/**
 * Send "new reply on your Valentine link" notification to the link creator (e.g. developer).
 * Used when a recipient replies on a link; only sent if creator role is developer/superadmin.
 * @param {string} to - Creator's email
 * @param {Object} opts - { creatorName, linkRecipientName, messagePreview, dashboardRepliesUrl }
 */
export async function sendValentineReplyNotificationEmail(to, { creatorName, linkRecipientName, messagePreview, dashboardRepliesUrl }) {
  const subject = 'New reply on your Valentine link';
  const preview = (messagePreview && String(messagePreview).trim().slice(0, 120)) || '(no preview)';
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #333; max-width: 560px; margin: 0 auto; padding: 20px;">
      <p>${creatorName ? `Hi ${creatorName},` : 'Hi,'}</p>
      <p>Someone replied on your Valentine link <strong>For: ${linkRecipientName || 'recipient'}</strong>.</p>
      <p style="background: #f5f5f5; padding: 12px; border-radius: 8px; border-left: 4px solid #4f46e5;">${preview.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
      ${dashboardRepliesUrl ? `<p><a href="${dashboardRepliesUrl}" style="color: #4f46e5; font-weight: 600;">View reply in dashboard</a></p>` : ''}
      <p style="font-size: 12px; color: #777;">This is an automated notification.</p>
    </body>
    </html>
  `;
  const textBody = `New reply on your Valentine link (For: ${linkRecipientName || 'recipient'}).\n\nPreview: ${preview}\n\n${dashboardRepliesUrl ? `View reply: ${dashboardRepliesUrl}` : ''}`;
  return sendEmail({ to, subject, htmlBody, textBody });
}

