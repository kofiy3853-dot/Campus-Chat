import { v2 as cloudinary } from 'cloudinary';

// Cloudinary is automatically configured by the CLOUDINARY_URL env variable
// but we can explicitly call config if needed. 
// cloudinary.config(); 

export const uploadToCloudinary = async (fileBuffer: Buffer, folder: string = 'campus-chat'): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] Stream error:', error);
          return reject(error);
        }
        if (!result) {
          console.error('[Cloudinary] No result returned from upload');
          return reject(new Error('Cloudinary upload failed: No result'));
        }
        console.log('[Cloudinary] Upload success secure_url:', result.secure_url);
        resolve(result.secure_url);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export default cloudinary;
