import { requireDB } from '../../../lib/dbHelper';
import User from '../../../models/User';
import authMiddleware from '../../../middlewares/authMiddleware';
import roleMiddleware from '../../../middlewares/roleMiddleware';
import { jsonError, jsonSuccess } from '../../../lib/response';
import { ensureRole } from '../../../lib/roles';
import { applyCors } from '../../../utils';

export default async function handler(req, res) {
  const { method, query: { id } } = req;
  if (await applyCors(req, res)) return;
  const db = await requireDB(res);
  if (!db) return;

  switch (method) {
    case 'GET': {
      try {
        const user = await User.findById(id).select('-password');
        if (!user) return jsonError(res, 404, 'User not found');
        return jsonSuccess(res, 200, 'Ok', { user });
      } catch (err) {
        return jsonError(res, 500, 'Failed to fetch user', err.message);
      }
    }
    case 'PUT': {
      try {
        const currentUser = await authMiddleware(req, res);
        if (!currentUser) return;

        const body = req.body || {};
        const { newPassword } = body;
        if (body.password) delete body.password;
        if (body.newPassword) delete body.newPassword;

        let normalizedRole = null;
        let roleDoc = null;
        if (Object.prototype.hasOwnProperty.call(body, 'role')) {
          if (!roleMiddleware(['superadmin', 'developer'])(req, res)) return;
          normalizedRole =
            typeof body.role === 'string' && body.role.trim()
              ? body.role.trim().toLowerCase()
              : '';
          if (!normalizedRole) {
            return jsonError(res, 400, 'Role must be a non-empty string');
          }
          roleDoc = await ensureRole(normalizedRole);
        }

        const userDoc = await User.findById(id);
        if (!userDoc) return jsonError(res, 404, 'User not found');

        if (Object.prototype.hasOwnProperty.call(body, 'name')) {
          const trimmedName = typeof body.name === 'string' ? body.name.trim() : '';
          if (!trimmedName) {
            return jsonError(res, 400, 'Name is required');
          }
          userDoc.name = trimmedName;
        }

        if (Object.prototype.hasOwnProperty.call(body, 'email')) {
          const trimmedEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
          if (!trimmedEmail) {
            return jsonError(res, 400, 'Email is required');
          }
          userDoc.email = trimmedEmail;
        }

        if (normalizedRole) {
          userDoc.role = normalizedRole;
          userDoc.roleRef = roleDoc?._id || null;
        }

        if (typeof newPassword === 'string' && newPassword.trim()) {
          const trimmedPassword = newPassword.trim();
          if (trimmedPassword.length < 5) {
            return jsonError(res, 400, 'New password must be at least 5 characters long');
          }
          userDoc.password = trimmedPassword;
        }

        if (Object.prototype.hasOwnProperty.call(body, 'isEmailVerified')) {
          if (!roleMiddleware(['superadmin', 'developer'])(req, res)) return;
          userDoc.isEmailVerified = Boolean(body.isEmailVerified);
        }

        if (Object.prototype.hasOwnProperty.call(body, 'isPaused')) {
          if (!roleMiddleware(['superadmin', 'developer'])(req, res)) return;
          userDoc.isPaused = Boolean(body.isPaused);
        }

        try {
          await userDoc.save();
        } catch (err) {
          if (err.code === 11000) {
            return jsonError(res, 409, 'Email already in use');
          }
          throw err;
        }

        const user = await User.findById(userDoc._id).select('-password');
        return jsonSuccess(res, 200, 'User updated', { user });
      } catch (err) {
        return jsonError(res, 500, 'Failed to update user', err.message);
      }
    }
    case 'DELETE': {
      try {
        const currentUser = await authMiddleware(req, res);
        if (!currentUser) return;
        if (!roleMiddleware(['admin', 'superadmin', 'hr', 'hr_admin', 'developer'])(req, res)) return;
        const user = await User.findByIdAndDelete(id).select('-password');
        if (!user) return jsonError(res, 404, 'User not found');
        return jsonSuccess(res, 200, 'User deleted', { user });
      } catch (err) {
        return jsonError(res, 500, 'Failed to delete user', err.message);
      }
    }
    default: {
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return jsonError(res, 405, `Method ${method} not allowed`);
    }
  }
}

