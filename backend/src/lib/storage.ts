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
