#!/usr/bin/env node
/**
 * Upload local frontend public media to Cloudinary and emit a mapping JSON.
 * Usage:
 *   npm install cloudinary
 *   CLOUDINARY_CLOUD_NAME=... CLOUDINARY_API_KEY=... CLOUDINARY_API_SECRET=... node upload_to_cloudinary.js
 *
 * The script uploads files under ../../frontend/public/showcase_photos_videos,
 * ../../frontend/public/showcase_reels, and ../../frontend/public/videos and
 * writes `cloudinary_mapping.json` alongside this script with local -> remote URLs.
 */
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

const ROOT = path.resolve(__dirname, '..', '..');
const PUBLIC_DIR = path.join(ROOT, 'frontend', 'public');
const TARGET_DIRS = ['showcase_photos_videos', 'showcase_reels', 'videos', 'video'];

function walk(dir) {
  const res = [];
  if (!fs.existsSync(dir)) return res;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) res.push(...walk(full));
    else res.push(full);
  }
  return res;
}

async function main() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error('Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in env');
    process.exit(1);
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });

  const mapping = {};

  for (const dirName of TARGET_DIRS) {
    const dir = path.join(PUBLIC_DIR, dirName);
    const files = walk(dir);
    for (const filePath of files) {
      const rel = path.relative(PUBLIC_DIR, filePath).replace(/\\/g, '/');
      const publicId = `devup/${rel}`.replace(/\.[^.]+$/, '');
      try {
        console.log('Uploading', rel);
        const res = await cloudinary.uploader.upload(filePath, {
          public_id: publicId,
          resource_type: 'auto',
          overwrite: false,
          folder: 'devup',
        });
        mapping[rel] = res.secure_url;
      } catch (err) {
        console.error('Failed upload', rel, err.message || err);
      }
    }
  }

  const outPath = path.join(__dirname, 'cloudinary_mapping.json');
  fs.writeFileSync(outPath, JSON.stringify(mapping, null, 2), 'utf8');
  console.log('Mapping written to', outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
