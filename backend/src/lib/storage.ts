import { supabaseAdmin } from "../config/supabase";
import { AppError } from "../middleware/errorHandler";
import { env } from "../config/env";
import { objectKey, verifyUpload } from "./uploads";

export const uploadFile = async (
  bucket: string,
  path: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<string> => {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, fileBuffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new AppError(500, `Failed to upload file to ${bucket}: ${error.message}`);
  }

  const { data: publicData } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicData.publicUrl;
};

export const deleteFile = async (bucket: string, path: string): Promise<void> => {
  const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);
  if (error) {
    throw new AppError(500, `Failed to delete file from ${bucket}: ${error.message}`);
  }
};

const MAX_LOGO_SIZE = 2 * 1024 * 1024;        // 2MB

/** Verified image → public URL. `folder` must be a server-side id, never request input. */
export async function uploadStartupImage(
  file: Express.Multer.File,
  folder: string,
  type: 'logo' | 'screenshot'
): Promise<string> {
  const image = verifyUpload(file, 'image', type === 'logo' ? MAX_LOGO_SIZE : undefined);
  const bucket = type === 'logo' ? env.STORAGE_BUCKET_LOGOS : env.STORAGE_BUCKET_BANNERS;
  const filename = objectKey([folder], type, image.ext);

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filename, image.buffer, {
      contentType: image.mime,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw new AppError(500, `Upload failed: ${error.message}`, "UPLOAD_FAILED");

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(filename);
  return data.publicUrl;
}

/**
 * Uploads to a private bucket and returns the object path, not a URL.
 *
 * Identity documents must never have a durable public address. Everything else
 * here returns `getPublicUrl`, which is right for a logo and wrong for a scan
 * of somebody's PAN card — so this deliberately hands back a path that is
 * useless without a signature, and callers store that instead.
 */
export const uploadPrivateFile = async (
  bucket: string,
  path: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<string> => {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, fileBuffer, { contentType, upsert: true });

  if (error) throw new AppError(500, `Failed to upload to ${bucket}: ${error.message}`, "UPLOAD_FAILED");
  return data.path;
};

/**
 * A short-lived link to a private object.
 *
 * Minutes, not hours: the link is handed to one reviewer looking at one
 * document, and a URL that outlives the review is a public URL with extra
 * steps — it gets pasted into chat and forwarded.
 */
export const signedUrl = async (
  bucket: string,
  path: string,
  expiresInSeconds = 300
): Promise<string | null> => {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);
  if (error) return null;
  return data.signedUrl;
};
