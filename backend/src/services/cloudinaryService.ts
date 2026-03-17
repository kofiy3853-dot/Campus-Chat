import { v2 as cloudinary } from 'cloudinary';

// Cloudinary is automatically configured by the CLOUDINARY_URL env variable
// but we can explicitly call config if needed. 
// cloudinary.config(); 

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
