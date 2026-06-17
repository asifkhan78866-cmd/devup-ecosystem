import { supabaseAdmin } from "../config/supabase";
import { AppError } from "../middleware/errorHandler";

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

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_LOGO_SIZE = 2 * 1024 * 1024;        // 2MB
const MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024;  // 5MB

export async function uploadStartupImage(
  file: Express.Multer.File,
  startupSlug: string,
  type: 'logo' | 'screenshot'
): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    throw new Error('Only JPEG, PNG, or WEBP images are allowed');
  }
  const maxSize = type === 'logo' ? MAX_LOGO_SIZE : MAX_SCREENSHOT_SIZE;
  if (file.size > maxSize) {
    throw new Error(`File too large. Max ${maxSize / 1024 / 1024}MB`);
  }

  const ext = file.mimetype.split('/')[1];
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const filename = `${startupSlug}/${type}-${Date.now()}-${randomSuffix}.${ext}`;
  const bucket = type === 'logo' 
    ? process.env.STORAGE_BUCKET_LOGOS! 
    : process.env.STORAGE_BUCKET_BANNERS!;

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(filename);
  return data.publicUrl;
}
