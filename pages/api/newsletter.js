import NewsletterSignup from '../../models/NewsletterSignup';
import { sendEmail } from '../../utils/email';
import { jsonError, jsonSuccess } from '../../lib/response';
import { applyCors } from '../../utils';
import { logger } from '../../utils/logger';
import { getDBConnection } from '../../lib/dbHelper';

/**
 * Footer newsletter / email capture
 * POST /api/newsletter
 * Body: { "email", "website_url"? } — website_url is a honeypot; must be empty
 */
export default async function handler(req, res) {
  if (await applyCors(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return jsonError(res, 405, `Method ${req.method} not allowed`);
  }

  const { email, website_url: websiteUrl } = req.body || {};
  if (websiteUrl) {
    return jsonSuccess(res, 200, 'Thanks for subscribing.', {});
  }

  const emailStr = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!emailStr || !/.+@.+\..+/.test(emailStr)) {
    return jsonError(res, 400, 'Please enter a valid email address.');
  }

  let saved = false;
  const { connected } = await getDBConnection();
  if (connected) {
    try {
      await NewsletterSignup.create({ email: emailStr });
      saved = true;
    } catch (dbErr) {
      if (dbErr.code === 11000) {
        return jsonSuccess(res, 200, "You're already on the list.", {});
      }
      logger.warn('[Newsletter] DB save failed:', dbErr.message);
    }
  }

  const htmlBody = `
      <!DOCTYPE html>
      <html><head><meta charset="utf-8" /></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p><strong>New newsletter signup</strong></p>
        <p>Email: ${emailStr}</p>
      </body></html>
    `;
  const textBody = `New newsletter signup\n\nEmail: ${emailStr}`;

  try {
    await sendEmail({
      to: process.env.SEED_ADMIN_EMAIL ,
      subject: `Newsletter signup: ${emailStr}`,
      htmlBody,
      textBody,
    });
  } catch (err) {
    logger.warn('[Newsletter] notify email failed:', err.message);
    if (!saved) {
      return jsonError(res, 503, 'Unable to subscribe right now. Please try again later.');
    }
  }

  logger.info(`[Newsletter] signup: ${emailStr}`);
  return jsonSuccess(res, 200, 'Thanks for subscribing.', {});
}
