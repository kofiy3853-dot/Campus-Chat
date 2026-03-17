import { v2 as cloudinary } from 'cloudinary';

// Cloudinary can be configured by CLOUDINARY_URL, but explicit config is often more reliable
if (process.env.CLOUDINARY_URL) {
  console.log('[Cloudinary] Found CLOUDINARY_URL, applying config');
  cloudinary.config({
    secure: true
  });
} else {
  console.warn('[Cloudinary] No CLOUDINARY_URL found in environment');
}

console.log('[Cloudinary] Configured cloud_name:', cloudinary.config().cloud_name);
console.log('[Cloudinary] Configured api_key:', cloudinary.config().api_key);
export const uploadToCloudinary = async (fileBuffer: Buffer, folder: string = 'campus-chat'): Promise<string> => {
  console.log(`[Cloudinary] Starting upload to folder: ${folder}, buffer size: ${fileBuffer.length}`);
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] Upload Error:', error);
          return reject(error);
        }
        if (!result) {
          console.error('[Cloudinary] No result returned');
          return reject(new Error('Cloudinary upload failed: No result'));
        }
        console.log('[Cloudinary] Upload Successful:', result.secure_url);
        resolve(result.secure_url);
      }
    );

    uploadStream.on('error', (err) => {
      console.error('[Cloudinary] Stream-level error:', err);
      reject(err);
    });

    uploadStream.end(fileBuffer);
  });
};

export default cloudinary;
