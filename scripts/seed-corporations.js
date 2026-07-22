/**
 * Seed script for Corporations and Wards
 * Run with: node scripts/seed-corporations.js
 */
import mongoose from 'mongoose';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';
import Corporation from '../models/Corporation.js';
import Ward from '../models/Ward.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvFiles() {
  const files = ['.env', '.env.local', '.env.production', '.env.production.local'];
  for (const file of files) {
    const filePath = resolve(__dirname, '..', file);
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

loadEnvFiles();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecowatch';

const corporations = [
  { name: 'GreenCity Environmental Corp', state: 'Punjab', district: 'Lahore' },
  { name: 'CleanRiver Waste Management', state: 'Sindh', district: 'Karachi' },
  { name: 'Eco Valley Solutions', state: 'Khyber Pakhtunkhwa', district: 'Peshawar' },
  { name: 'Urban Green Initiative', state: 'Punjab', district: 'Islamabad' },
  { name: 'Blue Sky Environmental Services', state: 'Balochistan', district: 'Quetta' },
];

const wardsByCorp = {
  'GreenCity Environmental Corp': [
    'Ward 1 - Gulberg', 'Ward 2 - DHA', 'Ward 3 - Model Town',
    'Ward 4 - Johar Town', 'Ward 5 - Cantonment',
  ],
  'CleanRiver Waste Management': [
    'Ward 1 - Clifton', 'Ward 2 - Saddar', 'Ward 3 - North Nazimabad',
    'Ward 4 - Gulshan-e-Iqbal', 'Ward 5 - Orangi Town',
  ],
  'Eco Valley Solutions': [
    'Ward 1 - Hayatabad', 'Ward 2 - University Town', 'Ward 3 - Saddar',
    'Ward 4 - Cantt', 'Ward 5 - Regi Model Town',
  ],
  'Urban Green Initiative': [
    'Ward 1 - F-6', 'Ward 2 - F-8', 'Ward 3 - G-9',
    'Ward 4 - G-10', 'Ward 5 - I-8',
  ],
  'Blue Sky Environmental Services': [
    'Ward 1 - Satellite Town', 'Ward 2 - Samungli', 'Ward 3 - Brewery',
    'Ward 4 - Jinnah Town', 'Ward 5 - Hazara Town',
  ],
};

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const corpData of corporations) {
      let corp = await Corporation.findOne({ name: corpData.name });
      if (!corp) {
        corp = await Corporation.create(corpData);
        console.log(`Created corporation: ${corp.name}`);
      } else {
        console.log(`Corporation already exists: ${corp.name}`);
      }

      const wards = wardsByCorp[corpData.name] || [];
      for (const wardName of wards) {
        const existing = await Ward.findOne({ name: wardName, corporation: corp._id });
        if (!existing) {
          await Ward.create({ name: wardName, corporation: corp._id });
          console.log(`  Created ward: ${wardName}`);
        }
      }
    }

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
