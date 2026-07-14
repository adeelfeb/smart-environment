import { requireDB } from '../../../lib/dbHelper';
import User from '../../../models/User';
import { jsonError, jsonSuccess } from '../../../lib/response';
import { ensureRole } from '../../../lib/roles';
import { applyCors } from '../../../utils';

const LOOPBACK_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
const DEFAULT_ROLE = 'hr';

function normalizeIp(ip) {
  if (!ip) {
    return '';
  }
  const trimmed = ip.trim();
  if (trimmed.startsWith('::ffff:')) {
    return trimmed.slice(7);
  }
  return trimmed;
}

function isLoopback(ip) {
  const normalized = normalizeIp(ip);
  return LOOPBACK_IPS.has(normalized);
}

function isLocalRequest(req) {
  const directIp = req.socket?.remoteAddress;
  if (directIp && isLoopback(directIp)) {
    return true;
  }

  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string') {
    const candidate = forwardedFor.split(',')[0];
    if (candidate && isLoopback(candidate)) {
      return true;
    }
  }

  return false;
}

export default async function handler(req, res) {
  if (await applyCors(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return jsonError(res, 405, `Method ${req.method} not allowed`);
  }

  if (!isLocalRequest(req)) {
    return jsonError(res, 403, 'Terminal access only: request must originate from localhost');
  }

  try {
    const db = await requireDB(res);
    if (!db) return;

    const { name, email, password, role } = req.body || {};
    const missing = [];
    if (!name) missing.push('name');
    if (!email) missing.push('email');
    if (!password) missing.push('password');

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

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return jsonSuccess(res, 200, 'User already exists', {
        user: {
          id: existing._id,
          name: existing.name,
          email: existing.email,
          role: existing.role,
          createdAt: existing.createdAt,
        },
      });
    }

    const targetRole = typeof role === 'string' && role.trim() ? role : DEFAULT_ROLE;
    const normalizedRole = targetRole.trim().toLowerCase();

    const roleDoc = await ensureRole(
      normalizedRole,
      `Role created via terminal setup endpoint: ${normalizedRole}`
    );

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: roleDoc.name,
      roleRef: roleDoc._id,
      isEmailVerified: true,
    });

    return jsonSuccess(res, 201, `Terminal user created with role: ${roleDoc.name}`, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    return jsonError(res, 500, 'Failed to create terminal user', err.message);
  }
}


