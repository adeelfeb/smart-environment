import { sendEmail } from '../../../utils/email';
import { jsonError, jsonSuccess } from '../../../lib/response';
import { applyCors } from '../../../utils';
import { logger } from '../../../utils/logger';
import { env } from '../../../lib/config';

/**
 * Test endpoint for email configuration
 * POST /api/test/email
 * Body: { "to": "test@example.com", "subject": "Test", "message": "Test message" }
 */
export default async function handler(req, res) {
  if (await applyCors(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return jsonError(res, 405, `Method ${req.method} not allowed`);
  }

  // Check which email provider is configured
  const resendApiKey = env.RESEND_API_KEY;
  const resendFromEmail = env.RESEND_FROM_EMAIL;
  const smtp2goApiKey = env.SMTP2GO_API_KEY;
  const smtp2goFromEmail = env.SMTP2GO_FROM_EMAIL;
  const smtpUsername = env.SMTP_USERNAME;
  const smtpPassword = env.SMTP_PASSWORD;

  // Determine which provider will be used (same order as email.js)
  let activeProvider = null;
  let fromEmail = null;
  let fromName = null;

  if (resendApiKey && resendApiKey.trim() !== '') {
    activeProvider = 'Resend';
    fromEmail = resendFromEmail || env.SMTP_FROM;
    fromName = env.RESEND_FROM_NAME || 'The Server';
  } else if (smtp2goApiKey && smtp2goApiKey.trim() !== '') {
    activeProvider = 'SMTP2Go';
    fromEmail = smtp2goFromEmail || env.SMTP_FROM;
    fromName = env.SMTP2GO_FROM_NAME || 'The Server';
  } else if (smtpUsername && smtpUsername.trim() !== '' && smtpPassword && smtpPassword.trim() !== '') {
    activeProvider = 'SMTP';
    fromEmail = env.SMTP_FROM;
    fromName = 'The Server';
  }

  if (!activeProvider) {
    return jsonError(
      res,
      500,
      'No email provider configured. Please configure one of: RESEND_API_KEY, SMTP2GO_API_KEY, or SMTP_USERNAME/SMTP_PASSWORD in your .env file.',
      {
        configured: {
          RESEND_API_KEY: resendApiKey ? '✅ Set' : '❌ Missing',
          RESEND_FROM_EMAIL: resendFromEmail ? '✅ Set' : '❌ Missing',
          SMTP2GO_API_KEY: smtp2goApiKey ? '✅ Set' : '❌ Missing',
          SMTP2GO_FROM_EMAIL: smtp2goFromEmail ? '✅ Set' : '❌ Missing',
          SMTP_USERNAME: smtpUsername ? '✅ Set' : '❌ Missing',
          SMTP_PASSWORD: smtpPassword ? '✅ Set' : '❌ Missing',
        },
      }
    );
  }

  const { to, subject, message } = req.body || {};

  if (!to) {
    return jsonError(res, 400, 'Missing required field: to (recipient email)');
  }

  const emailOk = typeof to === 'string' && /.+@.+\..+/.test(to);
  if (!emailOk) {
    return jsonError(res, 400, 'Invalid email format');
  }

  try {
    const testSubject = subject || 'Test Email from Your Application';
    const testMessage = message || `This is a test email to verify your ${activeProvider} configuration is working correctly.`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
          <h2 style="color: #333; margin-top: 0;">Test Email</h2>
          <p>${testMessage}</p>
          <p>If you received this email, your ${activeProvider} configuration is working correctly! ✅</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">
            <strong>Configuration Details:</strong><br>
            Provider: ${activeProvider}<br>
            From Email: ${fromEmail}<br>
            From Name: ${fromName}
          </p>
        </div>
      </body>
      </html>
    `;

    const textBody = `
Test Email

${testMessage}

If you received this email, your ${activeProvider} configuration is working correctly! ✅

---
Configuration Details:
Provider: ${activeProvider}
From Email: ${fromEmail}
From Name: ${fromName}
    `;

    const result = await sendEmail({
      to,
      subject: testSubject,
      htmlBody,
      textBody,
    });

    logger.info(`Test email sent successfully to: ${to} via ${activeProvider}`);

    return jsonSuccess(res, 200, 'Test email sent successfully!', {
      recipient: to,
      messageId: result.messageId,
      provider: activeProvider,
      configuration: {
        fromEmail,
        fromName,
      },
    });
  } catch (error) {
    logger.error('Test email failed:', error.message);
    return jsonError(res, 500, 'Failed to send test email', {
      error: error.message,
      provider: activeProvider,
      configuration: {
        RESEND_API_KEY: resendApiKey ? '✅ Set' : '❌ Missing',
        RESEND_FROM_EMAIL: resendFromEmail ? '✅ Set' : '❌ Missing',
        SMTP2GO_API_KEY: smtp2goApiKey ? '✅ Set' : '❌ Missing',
        SMTP2GO_FROM_EMAIL: smtp2goFromEmail ? '✅ Set' : '❌ Missing',
        SMTP_USERNAME: smtpUsername ? '✅ Set' : '❌ Missing',
        SMTP_PASSWORD: smtpPassword ? '✅ Set' : '❌ Missing',
      },
    });
  }
}

