import { supabase } from '../config/supabase';
import path from 'path';

const BUCKET = process.env.SUPABASE_BUCKET || 'upload';

/**
 * Upload a file buffer to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export const uploadToSupabaseStorage = async (
  fileBuffer: Buffer,
  fileName: string,
  folder: string = 'chat'
): Promise<string> => {
  const ext = path.extname(fileName).toLowerCase();
  const baseName = path.basename(fileName, ext);
  const uniqueFileName = `${folder}/${Date.now()}-${baseName}${ext}`;

  let contentType = 'application/octet-stream';
  if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
  else if (ext === '.png') contentType = 'image/png';
  else if (ext === '.gif') contentType = 'image/gif';
  else if (ext === '.webp') contentType = 'image/webp';
  else if (ext === '.mp3') contentType = 'audio/mpeg';
  else if (ext === '.ogg') contentType = 'audio/ogg';
  else if (ext === '.wav') contentType = 'audio/wav';
  else if (ext === '.webm') contentType = 'audio/webm';
  else if (ext === '.m4a') contentType = 'audio/mp4';
  else if (ext === '.mp4') contentType = 'video/mp4';
  else if (ext === '.aac') contentType = 'audio/aac';
  else if (ext === '.pdf') contentType = 'application/pdf';

  console.log(`[Supabase Storage] Uploading to: ${uniqueFileName}, size: ${fileBuffer.length}, type: ${contentType}`);
 
  if (!supabase) {
    throw new Error('Supabase Storage not configured. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(uniqueFileName, fileBuffer, {
      cacheControl: '31536000',
      upsert: false,
      contentType,
    });

  if (error) {
    console.error('[Supabase Storage] Upload error:', error);
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  if (!supabase) {
    throw new Error('Supabase Storage not configured.');
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
    
    if (!supabase) {
      throw new Error('Supabase Storage not configured.');
    }

    const { error } = await supabase.storage.from(BUCKET).remove([filePath]);

    if (error) throw error;
    console.log('[Supabase Storage] File deleted successfully');
  } catch (error) {
    console.error('[Supabase Storage] Delete error:', error);
    throw new Error(`Supabase Storage delete failed: ${error}`);
  }
};
