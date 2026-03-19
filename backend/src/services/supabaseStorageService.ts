import { supabase } from '../config/supabase';
import path from 'path';

const BUCKET = process.env.SUPABASE_BUCKET || 'chat-media';

/**
 * Upload a file buffer to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export const uploadToSupabaseStorage = async (
  fileBuffer: Buffer,
  fileName: string,
  folder: string = 'chat'
): Promise<string> => {
  const ext = path.extname(fileName);
  const baseName = path.basename(fileName, ext);
  const uniqueFileName = `${folder}/${Date.now()}-${baseName}${ext}`;

  console.log(`[Supabase Storage] Uploading to: ${uniqueFileName}, size: ${fileBuffer.length}`);

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(uniqueFileName, fileBuffer, {
      cacheControl: '31536000',
      upsert: false,
    });

  if (error) {
    console.error('[Supabase Storage] Upload error:', error);
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(data.path);

  console.log('[Supabase Storage] Upload successful:', publicUrlData.publicUrl);
  return publicUrlData.publicUrl;
};

/**
 * Delete a file from Supabase Storage by its public URL.
 */
export const deleteFromSupabaseStorage = async (fileUrl: string): Promise<void> => {
  try {
    // Extract the path within the bucket from the public URL
    // URL format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    const url = new URL(fileUrl);
    const segments = url.pathname.split('/');
    const bucketIndex = segments.indexOf('public') + 1;
    if (bucketIndex <= 0 || bucketIndex >= segments.length - 1) {
      console.warn('[Supabase Storage] Could not parse file path from URL:', fileUrl);
      return;
    }
    const filePath = segments.slice(bucketIndex + 1).join('/');

    console.log(`[Supabase Storage] Deleting file: ${filePath}`);
    const { error } = await supabase.storage.from(BUCKET).remove([filePath]);

    if (error) throw error;
    console.log('[Supabase Storage] File deleted successfully');
  } catch (error) {
    console.error('[Supabase Storage] Delete error:', error);
    throw new Error(`Supabase Storage delete failed: ${error}`);
  }
};
