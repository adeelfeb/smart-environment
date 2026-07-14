import { jsonError, jsonSuccess } from '../../../lib/response';
import { applyCors } from '../../../utils';
import authMiddleware from '../../../middlewares/authMiddleware';
import { createAuditLog } from '../../../controllers/auditLogController';
import { promises as fs } from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'complaints');

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseMultipartForm(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
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

export default async function handler(req, res) {
  if (await applyCors(req, res)) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return jsonError(res, 405, `Method ${req.method} not allowed`);
  }

  const user = await authMiddleware(req, res);
  if (!user) return;

  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const parts = await parseMultipartForm(req);
    const filePart = parts.find((p) => p.filename);

    if (!filePart) {
      return jsonError(res, 400, 'No file uploaded');
    }

    const ext = path.extname(filePart.filename) || '.jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    await fs.writeFile(filepath, filePart.content);

    const photoUrl = `/uploads/complaints/${filename}`;

    return jsonSuccess(res, 200, 'File uploaded', {
      photoUrl,
      photoFilename: filename,
    });
  } catch (err) {
    return jsonError(res, 500, 'Failed to upload file', err.message);
  }
}
