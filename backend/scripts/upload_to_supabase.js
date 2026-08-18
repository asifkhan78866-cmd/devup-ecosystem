#!/usr/bin/env node
/**
 * Upload frontend/public media to Supabase storage and emit mapping JSON.
 * Usage:
 *   npm install @supabase/supabase-js
 *   set SUPABASE_URL=... & set SUPABASE_SERVICE_ROLE_KEY=... & node upload_to_supabase.js
 *
 * It will ensure a bucket named `showcase-media` exists (public) and upload files
 * from frontend/public/showcase_photos_videos, showcase_reels, videos, video.
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const ROOT = path.resolve(__dirname, "..", "..");
const PUBLIC_DIR = path.join(ROOT, "frontend", "public");
const TARGET_DIRS = [
  "showcase_photos_videos",
  "showcase_reels",
  "videos",
  "video",
];
const BUCKET = process.env.SUPABASE_SHOWCASE_BUCKET || "showcase-media";

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
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env");
    process.exit(1);
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // Ensure bucket exists
  try {
    const { data: bucket } = await supabaseAdmin.storage.getBucket(BUCKET);
    if (!bucket) {
      console.log("Creating bucket", BUCKET);
      await supabaseAdmin.storage.createBucket(BUCKET, { public: true });
    } else {
      console.log("Bucket exists:", BUCKET);
    }
  } catch (e) {
    // If getBucket throws, try to create
    try {
      await supabaseAdmin.storage.createBucket(BUCKET, { public: true });
    } catch (ee) {
      /* ignore */
    }
  }

  const mapping = {};

  for (const dirName of TARGET_DIRS) {
    const dir = path.join(PUBLIC_DIR, dirName);
    const files = walk(dir);
    for (const filePath of files) {
      const rel = path.relative(PUBLIC_DIR, filePath).replace(/\\/g, "/");
      const dest = rel; // keep same relative path inside bucket
      try {
        console.log("Uploading", rel);
        const file = fs.readFileSync(filePath);
        const getContentType = (p) => {
          const ext = p.split(".").pop().toLowerCase();
          switch (ext) {
            case "jpg":
            case "jpeg":
              return "image/jpeg";
            case "png":
              return "image/png";
            case "webp":
              return "image/webp";
            case "mp4":
              return "video/mp4";
            case "webm":
              return "video/webm";
            case "pdf":
              return "application/pdf";
            case "svg":
              return "image/svg+xml";
            default:
              return "application/octet-stream";
          }
        };

        const { error } = await supabaseAdmin.storage
          .from(BUCKET)
          .upload(dest, file, {
            contentType: getContentType(filePath),
            cacheControl: "public, max-age=31536000",
          });
        if (error) {
          console.error("Upload error", rel, error.message);
          continue;
        }
        const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(dest);
        mapping[rel] = data.publicUrl;
      } catch (err) {
        console.error("Failed upload", rel, err.message || err);
      }
    }
  }

  const outPath = path.join(__dirname, "supabase_mapping.json");
  fs.writeFileSync(outPath, JSON.stringify(mapping, null, 2), "utf8");
  console.log("Mapping written to", outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
