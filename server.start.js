/**
 * Production startup script.
 *
 * 1. Seeds the super_admin user (idempotent — safe to run every time).
 * 2. Launches the Next.js production server.
 *
 * Credentials come from environment variables (never hardcoded):
 *   SEED_ADMIN_NAME     – display name           (default: Super_Admin)
 *   SEED_ADMIN_EMAIL    – login email            (default: admin@admin.com)
 *   SEED_ADMIN_PASSWORD – password (min 5 chars) (default: Admin@12345)
 *   SEED_ADMIN_ROLE     – role name              (default: superadmin)
 *   MONGODB_URI         – MongoDB connection string (required)
 *
 * Usage:
 *   node server.start.js
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env files ─────────────────────────────────────────────────────────
function loadEnvFiles() {
  const files = ['.env', '.env.local', '.env.production', '.env.production.local'];
  for (const file of files) {
    const filePath = resolve(__dirname, file);
    if (!existsSync(filePath)) continue;
    try {
      const content = readFileSync(filePath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx < 1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    } catch {
      // Skip unreadable files
    }
  }
}

// ── Models (inline to avoid Next.js import chain) ──────────────────────────
const RoleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '', trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    password: { type: String, required: true, minlength: 5 },
    role: { type: String, default: 'citizen', index: true },
    roleRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', default: null },
    isEmailVerified: { type: Boolean, default: false, index: true },
    isPaused: { type: Boolean, default: false, index: true },
    corporation: { type: mongoose.Schema.Types.ObjectId, ref: 'Corporation', default: null },
    phone: { type: String, default: null, trim: true },
  },
  { timestamps: true, versionKey: false }
);

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const Role = mongoose.models.Role || mongoose.model('Role', RoleSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

// ── Configuration ──────────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'Super_Admin';
const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL || 'admin@admin.com').toLowerCase().trim();
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';
const ADMIN_ROLE = (process.env.SEED_ADMIN_ROLE || 'superadmin').toLowerCase().trim();

// ── Seed ───────────────────────────────────────────────────────────────────
async function seedAdmin() {
  if (!MONGODB_URI) {
    console.warn('[startup] MONGODB_URI not set — skipping seed.');
    return;
  }
  if (ADMIN_PASSWORD.length < 5) {
    console.error('[startup] SEED_ADMIN_PASSWORD must be at least 5 characters. Aborting seed.');
    process.exit(1);
  }

  console.log('[startup] Connecting to MongoDB for seed...');
  await mongoose.connect(MONGODB_URI);
  console.log('[startup] Connected.');

  try {
    let role = await Role.findOne({ name: ADMIN_ROLE });
    if (!role) {
      role = await Role.create({
        name: ADMIN_ROLE,
        description: 'Full system access — created during initial seed',
      });
      console.log(`[startup] Created role: ${role.name}`);
    }

    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      if (existing.role !== role.name) {
        await User.updateOne({ _id: existing._id }, { $set: { role: role.name, roleRef: role._id } });
        console.log(`[startup] Fixed admin role: ${existing.email} (${existing.role} → ${role.name})`);
      } else {
        console.log(`[startup] Admin user already exists (${ADMIN_EMAIL}). Skipping.`);
      }
    } else {
      const user = await User.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: role.name,
        roleRef: role._id,
        isEmailVerified: true,
      });
      console.log(`[startup] Created admin user: ${user.email} (role: ${user.role})`);
    }

    console.log('[startup] Seed completed.');
  } catch (err) {
    console.error('[startup] Seed failed:', err.message);
    // Don't abort — let the server start even if seed fails
  } finally {
    await mongoose.disconnect();
  }
}

// ── Launch Next.js server ──────────────────────────────────────────────────
function startServer() {
  const nextBin = resolve(__dirname, 'node_modules', '.bin', 'next');
  const args = ['start', '-H', '0.0.0.0', '-p', process.env.PORT || '8000'];

  console.log(`[startup] Starting Next.js server: ${nextBin} ${args.join(' ')}`);

  const child = spawn(nextBin, args, {
    cwd: __dirname,
    stdio: 'inherit',
    env: process.env,
  });

  child.on('error', (err) => {
    console.error('[startup] Failed to start Next.js:', err.message);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code ?? 1);
  });
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  loadEnvFiles();
  await seedAdmin();
  startServer();
}

main();
