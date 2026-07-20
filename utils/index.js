import { jsonSuccess, jsonError } from '../lib/response';
export { jsonSuccess, jsonError };
export function validationError(res, details) {
  return jsonError(res, 400, 'Validation error', details);
}
export { logger } from './logger';
export { applyCors, clearCorsCache } from './cors';
export { withErrorHandling } from './asyncHandler';
export { sendEmail, sendOTPEmail, sendWelcomeEmail } from './email';
export {
  generateOTP,
  generateOTPExpiry,
  isOTPExpired,
  verifyOTP,
  getOTPExpiryMinutes,
} from './otp';


