import { requireDB } from '../../../lib/dbHelper';
import User from '../../../models/User';
import authMiddleware from '../../../middlewares/authMiddleware';
import roleMiddleware from '../../../middlewares/roleMiddleware';
import { jsonError, jsonSuccess } from '../../../lib/response';
import { ensureRole } from '../../../lib/roles';
import { applyCors } from '../../../utils';

function isValidEmail(value) {
  if (typeof value !== 'string') return false;
  return /.+@.+\..+/.test(value.trim());
}

const MIN_PASSWORD_LENGTH = 5;

export default async function handler(req, res) {
  const { method } = req;
  if (await applyCors(req, res)) return;
  const db = await requireDB(res);
  if (!db) return;

  switch (method) {
    case 'GET': {
      try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        return jsonSuccess(res, 200, 'Ok', { users });
      } catch (err) {
        return jsonError(res, 500, 'Failed to fetch users', err.message);
      }
    }
    case 'POST': {
      try {
        const user = await authMiddleware(req, res);
        if (!user) return;
        if (!roleMiddleware(['superadmin', 'developer'])(req, res)) return;
        const { name, email, password, role, isEmailVerified } = req.body || {};
        const trimmedName = typeof name === 'string' ? name.trim() : '';
        const trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const trimmedPassword = typeof password === 'string' ? password.trim() : '';
        const normalizedRole =
          typeof role === 'string' && role.trim() ? role.trim().toLowerCase() : 'base_user';

        if (!trimmedName || !trimmedPassword) {
          return jsonError(res, 400, 'Name and password are required');
        }

        if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
          return jsonError(res, 400, 'Valid email is required');
        }

        // Check if email already exists
        const emailExists = await User.findOne({ email: trimmedEmail });
        if (emailExists) return jsonError(res, 409, 'Email already in use');

        if (trimmedPassword.length < MIN_PASSWORD_LENGTH) {
          return jsonError(res, 400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
        }

        const roleDoc = await ensureRole(
          normalizedRole,
          `Role created via user creation endpoint: ${normalizedRole}`
        );

        const userData = {
          name: trimmedName,
          email: trimmedEmail,
          password: trimmedPassword,
          role: roleDoc.name,
          roleRef: roleDoc._id,
        };

        // Allow admin to pre-verify users when creating
        if (typeof isEmailVerified === 'boolean') {
          userData.isEmailVerified = isEmailVerified;
        }

        const created = await User.create(userData);

        const safe = {
          id: created._id,
          name: created.name,
          email: created.email,
          username: created.username,
          role: created.role,
          isEmailVerified: Boolean(created.isEmailVerified),
          isPaused: Boolean(created.isPaused),
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        };
        return jsonSuccess(res, 201, 'User created', { user: safe });
      } catch (err) {
        return jsonError(res, 500, 'Failed to create user', err.message);
      }
    }
    default: {
      res.setHeader('Allow', ['GET', 'POST']);
      return jsonError(res, 405, `Method ${method} not allowed`);
    }
  }
}

