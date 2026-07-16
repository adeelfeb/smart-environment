import { jsonError, jsonSuccess } from '../../../lib/response';
import { applyCors } from '../../../utils';
import authMiddleware from '../../../middlewares/authMiddleware';
import { promises as fs } from 'fs';
import path from 'path';
import cloudinary from 'cloudinary';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'complaints');
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseMultipartForm(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalSize = 0;

    req.on('data', (chunk) => {
      totalSize += chunk.length;
      if (totalSize > MAX_FILE_SIZE + 1024) {
        req.destroy();
        return reject(new Error('File too large. Maximum size is 20MB.'));
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const body = Buffer.concat(chunks);
        const boundary = req.headers['content-type']?.split('boundary=')?.[1];
        if (!boundary) return reject(new Error('No boundary'));

        const parts = [];
        const boundaryBuffer = Buffer.from(`--${boundary}`);
        let start = 0;

        while (true) {
          const idx = body.indexOf(boundaryBuffer, start);
          if (idx === -1) break;

          if (start > 0) {
            const partData = body.slice(start, idx);
            const headerEnd = partData.indexOf('\r\n\r\n');
            if (headerEnd !== -1) {
              const headers = partData.slice(0, headerEnd).toString();
              const content = partData.slice(headerEnd + 4, partData.length - 2);
              const nameMatch = headers.match(/name="([^"]+)"/);
              const filenameMatch = headers.match(/filename="([^"]+)"/);
              if (nameMatch) {
                parts.push({
                  name: nameMatch[1],
                  filename: filenameMatch ? filenameMatch[1] : null,
                  content: filenameMatch ? content : content.toString(),
                });
              }
            }
          }
          start = idx + boundaryBuffer.length + 2;
        }
        resolve(parts);
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function uploadToCloudinary(buffer, filename) {
  return new Promise((resolve, reject) => {
    const ext = path.extname(filename).replace('.', '') || 'jpg';
    const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', heic: 'image/heic' };
    const contentType = mimeMap[ext.toLowerCase()] || 'image/jpeg';

    const stream = cloudinary.v2.uploader.upload_stream(
      {
        folder: 'complaints',
        resource_type: 'image',
        format: ext,
        public_id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
}

async function saveLocally(buffer, filename) {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const filepath = path.join(UPLOAD_DIR, filename);
  await fs.writeFile(filepath, buffer);
  return `/uploads/complaints/${filename}`;
}

export default async function handler(req, res) {
  if (await applyCors(req, res)) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return jsonError(res, 405, `Method ${req.method} not allowed`);
  }

  const user = await authMiddleware(req, res);
  if (!user) return;

  try {
    const parts = await parseMultipartForm(req);
    const filePart = parts.find((p) => p.filename);

    if (!filePart) {
      return jsonError(res, 400, 'No file uploaded');
    }

    if (filePart.content.length > MAX_FILE_SIZE) {
      return jsonError(res, 413, 'File too large. Maximum size is 20MB.');
    }

    const ext = path.extname(filePart.filename) || '.jpg';
    const baseName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const localFilename = `${baseName}${ext}`;

    let photoUrl;
    let photoFilename;
    let storage = 'local';

    if (isCloudinaryConfigured) {
      try {
        const result = await uploadToCloudinary(filePart.content, filePart.filename);
        photoUrl = result.secure_url;
        photoFilename = result.public_id;
        storage = 'cloudinary';
      } catch (cloudErr) {
        console.error('Cloudinary upload failed, falling back to local:', cloudErr.message);
      }
    }

    if (!photoUrl) {
      photoUrl = await saveLocally(filePart.content, localFilename);
      photoFilename = localFilename;
    }

    return jsonSuccess(res, 200, 'File uploaded', {
      photoUrl,
      photoFilename,
      storage,
    });
  } catch (err) {
    return jsonError(res, 500, 'Failed to upload file', err.message);
  }
}
