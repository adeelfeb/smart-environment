import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import Modal from '../Modal';
import { safeParseJsonResponse } from '../../utils/safeJsonResponse';
import styles from '../../styles/UserOverviewTable.module.css';

ModuleRegistry.registerModules([AllCommunityModule]);

const AgGridReact = dynamic(
  () => import('ag-grid-react').then((mod) => mod.AgGridReact),
  { ssr: false }
);

const DATE_FORMAT_OPTIONS = {
  dateStyle: 'medium',
  timeStyle: 'short',
};

const EDIT_ROLES = new Set(['superadmin', 'developer']);
const ROLE_OPTIONS = [
  { value: 'superadmin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'developer', label: 'Developer' },
  { value: 'citizen', label: 'Citizen' },
];
const DEFAULT_ROLE = 'citizen';
const MIN_PASSWORD_LENGTH = 5;
const ROLES_WITH_USERNAME = [];

function isValidEmail(value) {
  if (typeof value !== 'string') return false;
  return /.+@.+\..+/.test(value.trim());
}

function formatDateCell(value, formatter) {
  if (!value) return '—';
  try {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return formatter.format(date);
  } catch {
    return '—';
  }
}

function VerifiedBadgeCellRenderer(params) {
  const verified = Boolean(params.value);
  return (
    <span className={`${styles.statusBadge} ${verified ? styles.statusBadgeSuccess : styles.statusBadgeWarning}`}>
      {verified ? 'Verified' : 'Unverified'}
    </span>
  );
}

function StatusBadgeCellRenderer(params) {
  const paused = Boolean(params.value);
  return (
    <span className={`${styles.statusBadge} ${paused ? styles.statusBadgeDanger : styles.statusBadgeSuccess}`}>
      {paused ? 'Paused' : 'Active'}
    </span>
  );
}

function ActionCellRenderer(params) {
  const { data, context } = params;
  const canEditUsers = Boolean(context?.canEditUsers);
  const onView = typeof context?.onView === 'function' ? context.onView : null;
  const onEdit = typeof context?.onEdit === 'function' ? context.onEdit : null;
  const onDelete = typeof context?.onDelete === 'function' ? context.onDelete : null;
  const deletingId = context?.deletingId || null;
  const editingId = context?.editingId || null;
  const isSaving = Boolean(context?.isSaving);
  const processingId = context?.processingId || null;
  const isProcessing = deletingId === data?.id || processingId === data?.id;
  const isEditingThisRow = editingId === data?.id;
  const disableActions = !canEditUsers || isProcessing || isSaving;

  const handleViewClick = (event) => {
    event?.stopPropagation();
    onView?.(data);
  };

  const handleEditClick = (event) => {
    event?.stopPropagation();
    if (disableActions) return;
    onEdit?.(data);
  };

  const handleDeleteClick = (event) => {
    event?.stopPropagation();
    if (disableActions) return;
    onDelete?.(data);
  };

  return (
    <div className={styles.actionButtons}>
      <button
        type="button"
        className={`${styles.actionButton} ${styles.actionButtonView}`}
        onClick={handleViewClick}
        title="View details"
      >
        View
      </button>
      {canEditUsers && (
        <>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.actionButtonSecondary}`}
            disabled={disableActions}
            onClick={handleEditClick}
          >
            {isSaving && isEditingThisRow ? 'Saving…' : 'Edit'}
          </button>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.actionButtonDanger}`}
            disabled={disableActions}
            onClick={handleDeleteClick}
          >
            {isProcessing ? 'Deleting…' : 'Delete'}
          </button>
        </>
      )}
    </div>
  );
}

const COMPACT_TABLE_BREAKPOINT = 960;

function UserViewModal({
  user,
  onClose,
  onEdit,
  onToggleVerified,
  onTogglePause,
  isProcessing,
  dateFormatter,
}) {
  if (!user) return null;
  const canEdit = Boolean(onEdit);
  const canToggleVerified = Boolean(onToggleVerified);
  const canTogglePause = Boolean(onTogglePause);

  return (
    <Modal
      isOpen={Boolean(user)}
      onClose={onClose}
      title="User Details"
      size="lg"
    >
      <div className={styles.viewModalContent}>
        <div className={styles.viewModalGrid}>
          <div className={styles.viewModalField}>
            <span className={styles.viewModalLabel}>Name</span>
            <span className={styles.viewModalValue}>{user.name || '—'}</span>
          </div>
          <div className={styles.viewModalField}>
            <span className={styles.viewModalLabel}>Email</span>
            <span className={styles.viewModalValue}>{user.email || '—'}</span>
          </div>
          {user.username && (
            <div className={styles.viewModalField}>
              <span className={styles.viewModalLabel}>Username</span>
              <span className={styles.viewModalValue}>{user.username}</span>
            </div>
          )}
          <div className={styles.viewModalField}>
            <span className={styles.viewModalLabel}>Role</span>
            <span className={styles.viewModalValue}>
              {user.role?.replace(/_/g, ' ') || '—'}
            </span>
          </div>
          <div className={styles.viewModalField}>
            <span className={styles.viewModalLabel}>Verification</span>
            <span className={`${styles.statusBadge} ${user.isEmailVerified ? styles.statusBadgeSuccess : styles.statusBadgeWarning}`}>
              {user.isEmailVerified ? 'Verified' : 'Unverified'}
            </span>
          </div>
          <div className={styles.viewModalField}>
            <span className={styles.viewModalLabel}>Status</span>
            <span className={`${styles.statusBadge} ${user.isPaused ? styles.statusBadgeDanger : styles.statusBadgeSuccess}`}>
              {user.isPaused ? 'Paused' : 'Active'}
            </span>
          </div>
          <div className={styles.viewModalField}>
            <span className={styles.viewModalLabel}>Created</span>
            <span className={styles.viewModalValue}>
              {formatDateCell(user.createdAt, dateFormatter)}
            </span>
          </div>
          <div className={styles.viewModalField}>
            <span className={styles.viewModalLabel}>Last Updated</span>
            <span className={styles.viewModalValue}>
              {formatDateCell(user.updatedAt, dateFormatter)}
            </span>
          </div>
          <div className={styles.viewModalField}>
            <span className={styles.viewModalLabel}>User ID</span>
            <span className={styles.viewModalValueId}>{user.id || user._id || '—'}</span>
          </div>
        </div>
        <div className={styles.viewModalActions}>
          {canEdit && (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => onEdit(user)}
            >
              Edit User
            </button>
          )}
          {canToggleVerified && (
            <button
              type="button"
              className={`${styles.actionButton} ${styles.actionButtonTertiary}`}
              disabled={isProcessing}
              onClick={() => onToggleVerified(user)}
            >
              {isProcessing ? 'Updating…' : user.isEmailVerified ? 'Mark Unverified' : 'Mark Verified'}
            </button>
          )}
          {canTogglePause && (
            <button
              type="button"
              className={`${styles.actionButton} ${user.isPaused ? styles.actionButtonResume : styles.actionButtonPause}`}
              disabled={isProcessing}
              onClick={() => onTogglePause(user)}
            >
              {isProcessing ? 'Updating…' : user.isPaused ? 'Resume User' : 'Pause User'}
            </button>
          )}
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function UserOverviewTable({ currentUser = null }) {
  const [rowData, setRowData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCompact, setIsCompact] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', username: '', role: DEFAULT_ROLE, newPassword: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [roleOptions, setRoleOptions] = useState(ROLE_OPTIONS);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [roleLoadError, setRoleLoadError] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', username: '', role: DEFAULT_ROLE, password: '', isEmailVerified: false });
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [viewUser, setViewUser] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(undefined, DATE_FORMAT_OPTIONS), []);

  const normalizedRole = (currentUser?.role || '').toLowerCase();
  const canEditUsers = useMemo(() => EDIT_ROLES.has(normalizedRole), [normalizedRole]);

  const normalizeUser = useCallback((user) => {
    if (!user || typeof user !== 'object') return null;
    const safeId = user.id || user._id || user.email || user.username;
    if (!safeId) return null;
    const normalizedRole =
      typeof user.role === 'string' && user.role.trim()
        ? user.role.trim().toLowerCase()
        : DEFAULT_ROLE;
    return {
      id: safeId,
      _id: user._id || safeId,
      name: user.name || '',
      email: user.email || '',
      username: user.username || '',
      role: normalizedRole,
      isEmailVerified: Boolean(user.isEmailVerified),
      isPaused: Boolean(user.isPaused),
      createdAt: user.createdAt || user.created_at || null,
      updatedAt: user.updatedAt || user.updated_at || null,
    };
  }, []);

  const editRoleOptions = useMemo(() => {
    const seen = new Set();
    const options = [];
    roleOptions.forEach((option) => {
      const value = option.value.toLowerCase();
      if (seen.has(value)) return;
      seen.add(value);
      options.push({ value, label: option.label });
    });
    if (editingUser?.role) {
      const normalized = editingUser.role.trim().toLowerCase();
      if (normalized && !seen.has(normalized)) {
        options.push({ value: normalized, label: normalized.replace(/_/g, ' ') });
      }
    }
    return options;
  }, [roleOptions, editingUser]);

  const columnDefs = useMemo(
    () => [
      {
        headerName: 'Name',
        field: 'name',
        minWidth: 160,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Email',
        field: 'email',
        minWidth: 180,
        filter: 'agTextColumnFilter',
        valueFormatter: (params) => params.value || '—',
      },
      {
        headerName: 'Username',
        field: 'username',
        minWidth: 120,
        filter: 'agTextColumnFilter',
        valueFormatter: (params) => params.value || '—',
      },
      {
        headerName: 'Role',
        field: 'role',
        minWidth: 110,
        filter: 'agTextColumnFilter',
        valueFormatter: (params) => params.value?.replace(/_/g, ' ') || '—',
      },
      {
        headerName: 'Verified',
        field: 'isEmailVerified',
        minWidth: 110,
        filter: 'agTextColumnFilter',
        cellRenderer: VerifiedBadgeCellRenderer,
      },
      {
        headerName: 'Status',
        field: 'isPaused',
        minWidth: 100,
        filter: 'agTextColumnFilter',
        valueFormatter: (params) => (params.value ? 'Paused' : 'Active'),
        cellRenderer: StatusBadgeCellRenderer,
      },
      {
        headerName: 'Created',
        field: 'createdAt',
        minWidth: 140,
        valueFormatter: (params) => formatDateCell(params.value, dateFormatter),
      },
      {
        headerName: 'Updated',
        field: 'updatedAt',
        minWidth: 140,
        valueFormatter: (params) => formatDateCell(params.value, dateFormatter),
      },
      {
        headerName: 'Actions',
        field: 'id',
        minWidth: 280,
        sortable: false,
        filter: false,
        cellRenderer: ActionCellRenderer,
        suppressMenu: true,
      },
    ],
    [dateFormatter]
  );

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
    }),
    []
  );

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/users/list', {
        method: 'GET',
        credentials: 'include',
      });
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Unexpected server response');
      }
      const payload = await safeParseJsonResponse(response);
      if (!response.ok || payload.success === false) {
        const message = payload?.message || 'Unable to fetch users';
        throw new Error(message);
      }
      const data = Array.isArray(payload.data) ? payload.data : [];
      const normalized = data
        .map(normalizeUser)
        .filter(Boolean);
      setRowData(normalized);
    } catch (err) {
      setError(err.message || 'Failed to load users');
      setRowData([]);
    } finally {
      setIsLoading(false);
    }
  }, [normalizeUser]);

  const loadRoles = useCallback(async () => {
    if (!canEditUsers) return;
    setIsLoadingRoles(true);
    setRoleLoadError('');
    try {
      const response = await fetch('/api/roles/list', {
        method: 'GET',
        credentials: 'include',
      });
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Unexpected server response');
      }
      const payload = await safeParseJsonResponse(response);
      if (!response.ok || payload.success === false) {
        const message = payload?.message || 'Unable to fetch roles';
        throw new Error(message);
      }
      const roles = Array.isArray(payload?.data?.roles) ? payload.data.roles : [];
      const seen = new Set();
      const merged = [];
      ROLE_OPTIONS.forEach((option) => {
        const key = option.value.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        merged.push({ value: key, label: option.label });
      });
      roles.forEach((roleDoc) => {
        const rawName = typeof roleDoc.name === 'string' ? roleDoc.name.trim().toLowerCase() : '';
        if (!rawName || seen.has(rawName)) return;
        const label = roleDoc.description?.trim() || rawName.replace(/_/g, ' ');
        merged.push({ value: rawName, label });
        seen.add(rawName);
      });
      merged.sort((a, b) => a.label.localeCompare(b.label));
      setRoleOptions(merged);
    } catch (err) {
      setRoleLoadError(err.message || 'Failed to load roles');
    } finally {
      setIsLoadingRoles(false);
    }
  }, [canEditUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!canEditUsers) return;
    loadRoles();
  }, [canEditUsers, loadRoles]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const evaluateViewport = () => {
      setIsCompact(window.innerWidth < COMPACT_TABLE_BREAKPOINT);
    };

    evaluateViewport();
    window.addEventListener('resize', evaluateViewport);

    return () => {
      window.removeEventListener('resize', evaluateViewport);
    };
  }, []);

  const handleEditUser = useCallback(
    (user) => {
      if (!canEditUsers || !user) return;
      setActionError('');
      setActionMessage('');
      if (isCreateOpen) {
        setIsCreateOpen(false);
        setCreateForm({ name: '', email: '', username: '', role: DEFAULT_ROLE, password: '' });
        setCreateError('');
        setCreateSuccess('');
      }
      const snapshot = { ...user };
      const normalizedRole =
        typeof snapshot.role === 'string' && snapshot.role.trim()
          ? snapshot.role.trim().toLowerCase()
          : DEFAULT_ROLE;
      setEditingUser(snapshot);
      setEditForm({
        name: snapshot.name || '',
        email: snapshot.email || '',
        username: snapshot.username || '',
        role: normalizedRole,
        newPassword: '',
      });
    },
    [canEditUsers, isCreateOpen]
  );

  const handleEditFieldChange = useCallback((event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setActionError('');
    setActionMessage('');
  }, []);

  const handleCancelEdit = useCallback(() => {
    if (isSaving) return;
    setEditingUser(null);
    setEditForm({ name: '', email: '', username: '', role: DEFAULT_ROLE, newPassword: '' });
    setActionError('');
  }, [isSaving]);

  const handleSubmitEdit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!editingUser || !canEditUsers) return;

      const trimmedName = editForm.name.trim();
      const trimmedEmail = editForm.email.trim();
      const normalizedRoleValue = ((editForm.role || '').trim() || DEFAULT_ROLE).toLowerCase();
      const trimmedPassword = editForm.newPassword.trim();

      if (!trimmedName) {
        setActionError('Name is required');
        return;
      }
      if (!trimmedEmail) {
        setActionError('Email is required');
        return;
      }
      if (!normalizedRoleValue) {
        setActionError('Role is required');
        return;
      }
      if (trimmedPassword && trimmedPassword.length < 5) {
        setActionError('New password must be at least 5 characters long');
        return;
      }

      setIsSaving(true);
      setActionError('');
      setActionMessage('');

      try {
        const targetId = editingUser._id || editingUser.id;
        const body = {
          name: trimmedName,
          email: trimmedEmail,
          role: normalizedRoleValue,
        };
        if (trimmedPassword) {
          body.newPassword = trimmedPassword;
        }
        const response = await fetch(`/api/users/${encodeURIComponent(targetId)}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const payload = await safeParseJsonResponse(response).catch(() => ({}));
        if (!response.ok || payload.success === false) {
          const message = payload?.message || 'Failed to update user';
          throw new Error(message);
        }
        const updatedUser = payload?.data?.user || null;
        if (updatedUser) {
          const normalized = normalizeUser({ ...updatedUser, id: updatedUser._id || editingUser.id });
          if (normalized) {
            setRowData((prev) =>
              prev.map((row) => (row.id === editingUser.id ? { ...row, ...normalized } : row))
            );
          }
        }
        setActionMessage('User updated successfully');
        setEditingUser(null);
        setEditForm({ name: '', email: '', username: '', role: DEFAULT_ROLE, newPassword: '' });
        loadRoles();
      } catch (err) {
        setActionError(err.message || 'Unable to update user');
      } finally {
        setIsSaving(false);
      }
    },
    [
      canEditUsers,
      editForm.email,
      editForm.name,
      editForm.role,
      editForm.newPassword,
      editingUser,
      normalizeUser,
      loadRoles,
    ]
  );

  const handleDeleteUser = useCallback(
    async (user) => {
      if (!canEditUsers || !user) return;
      const targetId = user._id || user.id || user.email;
      if (!targetId) return;
      const safeRowId = user.id || user._id || user.email;

      const confirmMessage = `Are you sure you want to delete ${user.name || user.email || 'this user'}?`;
      if (typeof window !== 'undefined') {
        const confirmed = window.confirm(confirmMessage);
        if (!confirmed) {
          return;
        }
      }

      setIsDeletingId(safeRowId);
      setActionError('');
      setActionMessage('');

      try {
        const response = await fetch(`/api/users/${encodeURIComponent(targetId)}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        const payload = await safeParseJsonResponse(response).catch(() => ({}));
        if (!response.ok || payload.success === false) {
          const message = payload?.message || 'Failed to delete user';
          throw new Error(message);
        }
        setRowData((prev) => prev.filter((row) => row.id !== safeRowId));
        if (editingUser?.id === safeRowId) {
          setEditingUser(null);
          setEditForm({ name: '', email: '', username: '', role: DEFAULT_ROLE, newPassword: '' });
        }
        setActionMessage('User deleted successfully');
      } catch (err) {
        setActionError(err.message || 'Unable to delete user');
      } finally {
        setIsDeletingId(null);
      }
    },
    [canEditUsers, editingUser]
  );

  const handleViewUser = useCallback((user) => {
    if (!user) return;
    setViewUser(user);
    setActionError('');
    setActionMessage('');
  }, []);

  const handleCloseView = useCallback(() => {
    setViewUser(null);
  }, []);

  const handleToggleVerified = useCallback(
    async (user) => {
      if (!canEditUsers || !user) return;
      const targetId = user._id || user.id;
      if (!targetId) return;
      setProcessingId(targetId);
      setActionError('');
      setActionMessage('');
      try {
        const response = await fetch(`/api/users/${encodeURIComponent(targetId)}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isEmailVerified: !user.isEmailVerified }),
        });
        const payload = await safeParseJsonResponse(response).catch(() => ({}));
        if (!response.ok || payload.success === false) {
          throw new Error(payload?.message || 'Failed to update verification status');
        }
        const updated = payload?.data?.user;
        const newVerified = Boolean(updated?.isEmailVerified ?? !user.isEmailVerified);
        setRowData((prev) =>
          prev.map((row) =>
            row.id === user.id ? { ...row, isEmailVerified: newVerified } : row
          )
        );
        if (viewUser?.id === user.id) {
          setViewUser((u) => (u ? { ...u, isEmailVerified: newVerified } : null));
        }
        setActionMessage(newVerified ? 'User marked as verified' : 'User marked as unverified');
      } catch (err) {
        setActionError(err.message || 'Unable to update verification status');
      } finally {
        setProcessingId(null);
      }
    },
    [canEditUsers, viewUser]
  );

  const handleTogglePause = useCallback(
    async (user) => {
      if (!canEditUsers || !user) return;
      const targetId = user._id || user.id;
      if (!targetId) return;
      setProcessingId(targetId);
      setActionError('');
      setActionMessage('');
      try {
        const response = await fetch(`/api/users/${encodeURIComponent(targetId)}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPaused: !user.isPaused }),
        });
        const payload = await safeParseJsonResponse(response).catch(() => ({}));
        if (!response.ok || payload.success === false) {
          throw new Error(payload?.message || 'Failed to update account status');
        }
        const updated = payload?.data?.user;
        const newPaused = Boolean(updated?.isPaused ?? !user.isPaused);
        setRowData((prev) =>
          prev.map((row) => (row.id === user.id ? { ...row, isPaused: newPaused } : row))
        );
        if (viewUser?.id === user.id) {
          setViewUser((u) => (u ? { ...u, isPaused: newPaused } : null));
        }
        setActionMessage(newPaused ? 'User paused—they cannot log in' : 'User resumed—they can log in again');
      } catch (err) {
        setActionError(err.message || 'Unable to update account status');
      } finally {
        setProcessingId(null);
      }
    },
    [canEditUsers, viewUser]
  );

  const handleCreateFieldChange = useCallback((event) => {
    const { name, value } = event.target;
    setCreateForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCreateError('');
    setCreateSuccess('');
  }, []);

  const handleToggleCreate = useCallback(() => {
    setCreateError('');
    setCreateSuccess('');
    setActionMessage('');
    setActionError('');
    if (!isCreateOpen) {
      setEditingUser(null);
      setEditForm({ name: '', email: '', username: '', role: DEFAULT_ROLE, newPassword: '' });
    }
    setCreateForm({ name: '', email: '', username: '', role: DEFAULT_ROLE, password: '', isEmailVerified: false });
    setIsCreateOpen((prev) => !prev);
  }, [isCreateOpen]);

  const handleSubmitCreate = useCallback(
    async (event) => {
      event.preventDefault();
      if (!canEditUsers) return;

      const trimmedName = (createForm.name || '').trim();
      const trimmedEmail = (createForm.email || '').trim().toLowerCase();
      const trimmedUsername = (createForm.username || '').trim().toLowerCase();
      const trimmedPassword = (createForm.password || '').trim();
      const normalizedRoleValue = ((createForm.role || '').trim() || DEFAULT_ROLE).toLowerCase();
      
      const isLovedOneRole = ROLES_WITH_USERNAME.includes(normalizedRoleValue);

      if (!trimmedName) {
        setCreateError('Name is required');
        return;
      }
      
      // For Loved One role, username is required; for others, email is required
      if (isLovedOneRole) {
        if (!trimmedUsername) {
          setCreateError('Username is required for Loved One role');
          return;
        }
        if (trimmedUsername.length < 3) {
          setCreateError('Username must be at least 3 characters long');
          return;
        }
        if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
          setCreateError('Username can only contain lowercase letters, numbers, and underscores');
          return;
        }
      } else {
        if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
          setCreateError('A valid email is required');
          return;
        }
      }
      
      if (!trimmedPassword || trimmedPassword.length < MIN_PASSWORD_LENGTH) {
        setCreateError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
        return;
      }

      setIsCreating(true);
      setCreateError('');
      setCreateSuccess('');
      setActionMessage('');
      setActionError('');

      try {
        const body = {
          name: trimmedName,
          password: trimmedPassword,
          role: normalizedRoleValue,
        };
        if (!isLovedOneRole && typeof createForm.isEmailVerified === 'boolean') {
          body.isEmailVerified = createForm.isEmailVerified;
        }
        
        // Add username for Loved One role, email for others
        if (isLovedOneRole) {
          body.username = trimmedUsername;
          // Add email only if provided for Loved One role
          if (trimmedEmail && isValidEmail(trimmedEmail)) {
            body.email = trimmedEmail;
          }
        } else {
          body.email = trimmedEmail;
        }

        const response = await fetch('/api/users', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const payload = await safeParseJsonResponse(response).catch(() => ({}));
        if (!response.ok || payload.success === false) {
          const message = payload?.message || 'Failed to create user';
          throw new Error(message);
        }
        const createdUser = payload?.data?.user || null;
        if (createdUser) {
          const normalized = normalizeUser({ ...createdUser, id: createdUser.id || createdUser._id });
          if (normalized) {
            setRowData((prev) => [normalized, ...prev.filter((row) => row.id !== normalized.id)]);
          }
        }
        setCreateSuccess('User created successfully');
        setCreateForm({ name: '', email: '', username: '', role: DEFAULT_ROLE, password: '', isEmailVerified: false });
        loadRoles();
      } catch (err) {
        setCreateError(err.message || 'Unable to create user');
      } finally {
        setIsCreating(false);
      }
    },
    [canEditUsers, createForm, loadRoles, normalizeUser]
  );

  const isEmpty = !isLoading && !error && rowData.length === 0;
  const editingId = editingUser?.id || null;

  return (
    <div className={styles.container}>
      <UserViewModal
        user={viewUser}
        onClose={handleCloseView}
        onEdit={canEditUsers ? (u) => { handleCloseView(); handleEditUser(u); } : null}
        onToggleVerified={canEditUsers ? handleToggleVerified : null}
        onTogglePause={canEditUsers ? handleTogglePause : null}
        isProcessing={viewUser ? processingId === (viewUser._id || viewUser.id) : false}
        dateFormatter={dateFormatter}
      />
      {error && <div className={`${styles.feedback} ${styles.feedbackError}`}>{error}</div>}
      {!error && isLoading && (
        <div className={`${styles.feedback} ${styles.feedbackInfo}`}>Loading users…</div>
      )}
      {actionMessage && <div className={`${styles.feedback} ${styles.feedbackSuccess}`}>{actionMessage}</div>}
      {actionError && <div className={`${styles.feedback} ${styles.feedbackError}`}>{actionError}</div>}
      {canEditUsers && roleLoadError && !editingUser && !isCreateOpen && (
        <div className={`${styles.feedback} ${styles.feedbackError}`}>{roleLoadError}</div>
      )}
      {isEmpty && <div className={`${styles.feedback} ${styles.feedbackInfo}`}>No users found yet.</div>}

      {canEditUsers && (
        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.toolbarButton}
            onClick={handleToggleCreate}
            disabled={isCreating}
          >
            {isCreateOpen ? 'Close Create Form' : 'New User'}
          </button>
        </div>
      )}

      {canEditUsers && isCreateOpen && (
        <form className={`${styles.editPanel} ${styles.createPanel}`} onSubmit={handleSubmitCreate}>
          <div className={styles.editPanelHeader}>
            <div className={styles.editPanelHeaderText}>
              <span className={styles.editPanelTitle}>Create New User</span>
              <p className={styles.panelDescription}>
                Add a user by assigning their role and temporary password. They can update their details after logging in.
              </p>
            </div>
          </div>
          {createError && (
            <div className={`${styles.inlineFeedback} ${styles.inlineFeedbackError}`}>{createError}</div>
          )}
          {createSuccess && (
            <div className={`${styles.inlineFeedback} ${styles.inlineFeedbackSuccess}`}>{createSuccess}</div>
          )}
          {isCreating && (
            <div className={`${styles.inlineFeedback} ${styles.inlineFeedbackInfo}`}>
              Creating user…
            </div>
          )}
          <div className={styles.editFormGrid}>
            <label className={styles.editField}>
              <span>
                Name <span className={styles.requiredMark}>*</span>
              </span>
              <input
                type="text"
                name="name"
                value={createForm.name}
                onChange={handleCreateFieldChange}
                disabled={isCreating}
                required
                placeholder="Enter full name"
                autoComplete="name"
              />
            </label>
            <label className={styles.editField}>
              <span>
                Role <span className={styles.requiredMark}>*</span>
              </span>
              <select
                name="role"
                value={createForm.role}
                onChange={handleCreateFieldChange}
                disabled={isCreating}
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {ROLES_WITH_USERNAME.includes(createForm.role) ? (
              <>
                <label className={styles.editField} style={{ gridColumn: '1 / -1' }}>
                  <span>
                    Username <span className={styles.requiredMark}>*</span>
                  </span>
                  <input
                    type="text"
                    name="username"
                    value={createForm.username}
                    onChange={handleCreateFieldChange}
                    disabled={isCreating}
                    required
                    placeholder="john_doe"
                    pattern="[a-z0-9_]+"
                    title="Only lowercase letters, numbers, and underscores"
                    autoComplete="off"
                  />
                  <small>
                    Unique username for login • Lowercase letters, numbers, and underscores only • Minimum 3 characters
                  </small>
                </label>
                <label className={styles.editField} style={{ gridColumn: '1 / -1' }}>
                  <span>Email <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Optional)</span></span>
                  <input
                    type="email"
                    name="email"
                    value={createForm.email}
                    onChange={handleCreateFieldChange}
                    disabled={isCreating}
                    placeholder="email@example.com (optional)"
                    autoComplete="email"
                  />
                  <small>
                    Email can be added later if needed
                  </small>
                </label>
              </>
            ) : (
              <label className={styles.editField} style={{ gridColumn: '1 / -1' }}>
                <span>
                  Email <span className={styles.requiredMark}>*</span>
                </span>
                <input
                  type="email"
                  name="email"
                  value={createForm.email}
                  onChange={handleCreateFieldChange}
                  disabled={isCreating}
                  required
                  placeholder="email@example.com"
                  autoComplete="email"
                />
              </label>
            )}
            <label className={styles.editField} style={{ gridColumn: '1 / -1' }}>
              <span>
                Password <span className={styles.requiredMark}>*</span>
              </span>
              <input
                type="password"
                name="password"
                value={createForm.password}
                onChange={handleCreateFieldChange}
                disabled={isCreating}
                placeholder={`Create a password (minimum ${MIN_PASSWORD_LENGTH} characters)`}
                required
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete="new-password"
              />
            </label>
            {!ROLES_WITH_USERNAME.includes(createForm.role) && (
              <label className={styles.editField} style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: 'row' }}>
                <input
                  type="checkbox"
                  name="isEmailVerified"
                  checked={createForm.isEmailVerified}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, isEmailVerified: e.target.checked }))}
                  disabled={isCreating}
                />
                <span>Mark email as verified (user can log in without verifying)</span>
              </label>
            )}
          </div>
          <div className={styles.editActions}>
            <button type="submit" className={styles.primaryButton} disabled={isCreating}>
              Create user
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleToggleCreate}
              disabled={isCreating}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {isCompact ? (
        <div className={styles.cardListWrapper} aria-live="polite">
          {!isEmpty && (
            <ul className={styles.cardList}>
              {rowData.map((user) => (
                <li key={user.id} className={styles.cardItem}>
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Name</span>
                    <span className={styles.cardValue}>{user.name || '—'}</span>
                  </div>
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Email</span>
                    <span className={styles.cardValue}>{user.email || '—'}</span>
                  </div>
                  {user.username && (
                    <div className={styles.cardRow}>
                      <span className={styles.cardLabel}>Username</span>
                      <span className={styles.cardValue}>{user.username}</span>
                    </div>
                  )}
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Role</span>
                    <span className={styles.cardValue}>
                      {user.role?.replace(/_/g, ' ') || '—'}
                    </span>
                  </div>
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Verified</span>
                    <span className={`${styles.statusBadge} ${user.isEmailVerified ? styles.statusBadgeSuccess : styles.statusBadgeWarning}`}>
                      {user.isEmailVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Status</span>
                    <span className={`${styles.statusBadge} ${user.isPaused ? styles.statusBadgeDanger : styles.statusBadgeSuccess}`}>
                      {user.isPaused ? 'Paused' : 'Active'}
                    </span>
                  </div>
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Created</span>
                    <span className={styles.cardValue}>
                      {formatDateCell(user.createdAt, dateFormatter)}
                    </span>
                  </div>
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Updated</span>
                    <span className={styles.cardValue}>
                      {formatDateCell(user.updatedAt, dateFormatter)}
                    </span>
                  </div>
                  <div className={`${styles.cardRow} ${styles.cardActions}`}>
                    <span className={styles.cardLabel}>Actions</span>
                    <div className={styles.actionButtons}>
                      <button
                        type="button"
                        className={`${styles.actionButton} ${styles.actionButtonView}`}
                        onClick={() => handleViewUser(user)}
                      >
                        View
                      </button>
                      {canEditUsers && (
                        <>
                          <button
                            type="button"
                            className={`${styles.actionButton} ${styles.actionButtonSecondary}`}
                            disabled={isSaving || isDeletingId === user.id || processingId === user.id}
                            onClick={() => handleEditUser(user)}
                          >
                            {isSaving && editingId === user.id ? 'Saving…' : 'Edit'}
                          </button>
                          <button
                            type="button"
                            className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                            disabled={isSaving || isDeletingId === user.id || processingId === user.id}
                            onClick={() => handleDeleteUser(user)}
                          >
                            {isDeletingId === user.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className={styles.gridWrapper}>
          <div className={`ag-theme-quartz ${styles.grid}`}>
            {typeof window !== 'undefined' && (
              <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                enableCellTextSelection
                animateRows
                headerHeight={64}
                rowHeight={70}
                domLayout="autoHeight"
                pagination
                paginationPageSize={10}
                suppressPaginationPanel={false}
                suppressRowClickSelection
                stopEditingWhenCellsLoseFocus
                context={{
                  onView: handleViewUser,
                  onEdit: handleEditUser,
                  onDelete: handleDeleteUser,
                  canEditUsers,
                  deletingId: isDeletingId,
                  processingId,
                  editingId,
                  isSaving,
                }}
              />
            )}
          </div>
        </div>
      )}

      {canEditUsers && editingUser && (
        <form className={styles.editPanel} onSubmit={handleSubmitEdit}>
          <div className={styles.editPanelHeader}>
            <span className={styles.editPanelTitle}>
              Edit {editingUser.name || editingUser.email || 'user'}
            </span>
          </div>
          {roleLoadError && (
            <div className={`${styles.inlineFeedback} ${styles.inlineFeedbackError}`}>
              {roleLoadError}
              <button
                type="button"
                className={styles.inlineRetryButton}
                onClick={loadRoles}
                disabled={isLoadingRoles}
              >
                Retry
              </button>
            </div>
          )}
          {isLoadingRoles && (
            <div className={`${styles.inlineFeedback} ${styles.inlineFeedbackInfo}`}>
              Loading role options…
            </div>
          )}
          {isSaving && (
            <div className={`${styles.inlineFeedback} ${styles.feedbackInfo}`}>
              Saving changes…
            </div>
          )}
          <div className={styles.editFormGrid}>
            <label className={styles.editField}>
              <span>Name</span>
              <input
                type="text"
                name="name"
                value={editForm.name}
                onChange={handleEditFieldChange}
                disabled={isSaving}
                required
              />
            </label>
            {editForm.username ? (
              <label className={styles.editField}>
                <span>Username</span>
                <input
                  type="text"
                  name="username"
                  value={editForm.username}
                  disabled
                  title="Username cannot be changed"
                  style={{ cursor: 'not-allowed', opacity: 0.7 }}
                />
                <small style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Username cannot be changed
                </small>
              </label>
            ) : null}
            <label className={styles.editField}>
              <span>Email {ROLES_WITH_USERNAME.includes(editForm.role) ? '(Optional)' : ''}</span>
              <input
                type="email"
                name="email"
                value={editForm.email}
                onChange={handleEditFieldChange}
                disabled={isSaving}
                required={!ROLES_WITH_USERNAME.includes(editForm.role)}
              />
            </label>
            <label className={styles.editField}>
              <span>Role</span>
              <select
                name="role"
                value={editForm.role}
                onChange={handleEditFieldChange}
                disabled={isSaving}
                required
              >
                {editRoleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.editField}>
              <span>New Password</span>
              <input
                type="password"
                name="newPassword"
                value={editForm.newPassword}
                onChange={handleEditFieldChange}
                disabled={isSaving}
                placeholder="Leave blank to keep current password"
                minLength={5}
              />
            </label>
          </div>
          <div className={styles.editActions}>
            <button type="submit" className={styles.primaryButton} disabled={isSaving}>
              Save changes
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleCancelEdit}
              disabled={isSaving}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

