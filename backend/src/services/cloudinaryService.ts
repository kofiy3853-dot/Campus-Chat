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
          console.error('Cloudinary upload error:', error);
          return reject(error);
        }
        if (!result) {
          return reject(new Error('Cloudinary upload failed: No result'));
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export default cloudinary;
