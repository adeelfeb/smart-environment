import { jsonError } from '../lib/response';

export default function roleMiddleware(allowedRoles = []) {
  const normalized = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return (req, res) => {
    if (!req.user) {
      jsonError(res, 401, 'Authentication required');
      return false;
    }
    if (!normalized.length) {
      return true;
    }
    const userRoleNormalized = typeof req.user.role === 'string' 
      ? req.user.role.trim().toLowerCase().replace(/[\s_-]+/g, '') 
      : '';
    const normalizedAllowed = normalized.map(r => 
      typeof r === 'string' ? r.trim().toLowerCase().replace(/[\s_-]+/g, '') : ''
    );

    // Grant full access to superadmin and developer roles
    const hasAccess = normalizedAllowed.includes(userRoleNormalized) || 
                      userRoleNormalized === 'superadmin' || 
                      userRoleNormalized === 'developer';
    if (!hasAccess) {
      jsonError(res, 403, 'Insufficient role permissions');
      return false;
    }
    return true;
  };
}


