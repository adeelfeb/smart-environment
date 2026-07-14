import { requireDB } from '../../../lib/dbHelper';
import User from '../../../models/User';
import Role from '../../../models/Role';
import { jsonError, jsonSuccess } from '../../../lib/response';
import { env } from '../../../lib/config';
import { ensureRole } from '../../../lib/roles';
import { applyCors } from '../../../utils';

export default async function handler(req, res) {
  if (await applyCors(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return jsonError(res, 405, `Method ${req.method} not allowed`);
  }

  // Check setup token (optional in development, required in production)
  const setupToken = env.SUPERADMIN_SETUP_TOKEN;
  const isDevelopment = env.NODE_ENV !== 'production';
  
  // Only require token if it's configured (production) or if provided
  if (setupToken) {
    const providedToken = req.headers['x-setup-token'] || req.query.token || req.body?.token;
    if (providedToken !== setupToken) {
      return jsonError(res, 403, 'Invalid setup token');
    }
  } else if (!isDevelopment) {
    // In production, token must be configured
    return jsonError(res, 403, 'Setup token not configured');
  }

  try {
    const db = await requireDB(res);
    if (!db) return;

    const { name, email, password, role } = req.body || {};
    const missing = [];
    if (!name) missing.push('name');
    if (!email) missing.push('email');
    if (!password) missing.push('password');
    if (!role) missing.push('role');

    if (missing.length) {
      return jsonError(res, 400, `Missing required field(s): ${missing.join(', ')}`);
    }

    const emailOk = typeof email === 'string' && /.+@.+\..+/.test(email);
    if (!emailOk) {
      return jsonError(res, 400, 'Invalid email format');
    }

    if (typeof password !== 'string' || password.length < 5) {
      return jsonError(res, 400, 'Password must be at least 5 characters long');
    }

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return jsonError(res, 409, 'Email already registered');
    }

    // Normalize role name
    const normalizedRole = typeof role === 'string' ? role.trim().toLowerCase() : 'base_user';

    // Ensure the role exists, create it if it doesn't
    const roleDoc = await ensureRole(
      normalizedRole,
      `Role created via setup endpoint: ${normalizedRole}`
    );

    // Create the user
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: roleDoc.name,
      roleRef: roleDoc._id,
      isEmailVerified: true,
    });

    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    return jsonSuccess(res, 201, `User created with role: ${normalizedRole}`, { user: safeUser });
  } catch (err) {
    return jsonError(res, 500, 'Failed to create user', err.message);
  }
}

