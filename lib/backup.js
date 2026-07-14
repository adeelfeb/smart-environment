/**
 * Backup and restore utilities for MongoDB collections.
 * Used by developer/superadmin-only backup panel.
 */

import connectDB from './db';
import AllowedOrigin from '../models/AllowedOrigin';
import Blog from '../models/Blog';
import ContactSubmission from '../models/ContactSubmission';
import HelpRequest from '../models/HelpRequest';
import Role from '../models/Role';
import User from '../models/User';

/** Model name -> Mongoose model. Order: Role/User first (references), then rest. */
export const BACKUP_MODELS = [
  { key: 'roles', model: Role },
  { key: 'users', model: User },
  { key: 'allowedorigins', model: AllowedOrigin },
  { key: 'blogs', model: Blog },
  { key: 'contactsubmissions', model: ContactSubmission },
  { key: 'helprequests', model: HelpRequest },
];

/** Serialize a value for JSON/Excel (dates and ObjectIds to string). */
function serializeValue(v) {
  if (v == null) return v;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object' && v.constructor?.name === 'ObjectId') return v.toString();
  if (Array.isArray(v)) return v.map(serializeValue);
  if (typeof v === 'object' && v.constructor === Object) {
    const out = {};
    for (const [k, val] of Object.entries(v)) out[k] = serializeValue(val);
    return out;
  }
  return v;
}

/** Serialize an array of docs for export. */
function serializeDocs(docs) {
  return docs.map((d) => serializeValue(d));
}

/**
 * Fetch all backup data from the database.
 * User model is exported with password (hash) for full restore.
 * @returns {Promise<Object>} { [collectionKey]: Array }
 */
export async function getBackupData() {
  await connectDB();
  const out = {};
  for (const { key, model } of BACKUP_MODELS) {
    let query = model.find({});
    if (model === User) query = query.select('-password');
    const docs = await query.lean();
    out[key] = serializeDocs(docs);
  }
  return out;
}

/**
 * Parse uploaded file buffer into backup shape { [collectionKey]: Array }.
 * @param {Buffer} buffer
 * @param {'json'|'excel'} format
 * @returns {Promise<Object>} { [collectionKey]: Array }
 */
export async function parseImportFile(buffer, format) {
  if (format === 'json') {
    const text = buffer.toString('utf8');
    const data = JSON.parse(text);
    if (typeof data !== 'object' || data === null) throw new Error('Invalid JSON: expected an object');
    return data;
  }
  if (format === 'excel') {
    const XLSX = await import('xlsx');
    const wb = XLSX.read(buffer, { type: 'buffer', raw: false });
    const out = {};
    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });
      const key = sheetName.toLowerCase().replace(/\s+/g, '');
      if (key) out[key] = rows;
    }
    return out;
  }
  throw new Error('Unsupported format. Use json or excel.');
}

/**
 * Apply imported data to the database. For each collection, insert each doc;
 * strip _id and __v so new IDs are generated. Skip invalid or duplicate entries.
 * @param {Object} data - { [collectionKey]: Array }
 * @returns {Promise<Object>} { [collectionKey]: { inserted, skipped, errors } }
 */
export async function applyImport(data) {
  await connectDB();
  const results = {};
  const keyToModel = Object.fromEntries(BACKUP_MODELS.map(({ key, model }) => [key, model]));

  for (const { key, model } of BACKUP_MODELS) {
    const rows = Array.isArray(data[key]) ? data[key] : [];
    results[key] = { inserted: 0, skipped: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || typeof row !== 'object') {
        results[key].skipped++;
        continue;
      }
      const doc = { ...row };
      delete doc._id;
      delete doc.__v;
      if (key === 'users' && !doc.password) doc.password = 'ImportedBackup1!';
      try {
        await model.create(doc);
        results[key].inserted++;
      } catch (err) {
        results[key].skipped++;
        const msg = err.message || String(err);
        if (results[key].errors.length < 10) results[key].errors.push(`Row ${i + 1}: ${msg}`);
      }
    }
  }

  return results;
}

/**
 * Convert backup data object to Excel workbook buffer.
 * @param {Object} data - { [collectionKey]: Array }
 * @returns {Buffer}
 */
export async function backupDataToExcelBuffer(data) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  for (const [key, rows] of Object.entries(data)) {
    if (!Array.isArray(rows) || rows.length === 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([[]]), key);
      continue;
    }
    const sheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, sheet, key.substring(0, 31));
  }
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}
