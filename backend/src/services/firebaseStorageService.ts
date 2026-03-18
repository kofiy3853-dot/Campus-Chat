import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Initialize Firebase Admin SDK
const serviceAccountPath = path.resolve(__dirname, '../firebase-service-account.json');

let serviceAccount;
try {
  if (fs.existsSync(serviceAccountPath)) {
    serviceAccount = require(serviceAccountPath);
    console.log('[Firebase Storage] Service account loaded from file');
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    console.log('[Firebase Storage] Service account loaded from environment');
  } else {
    throw new Error('No Firebase service account configuration found');
  }
} catch (error) {
  console.error('[Firebase Storage] Failed to load service account:', error);
  throw error;
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'campus-chat.appspot.com'
  });
}

const storage = admin.storage();
const bucket = storage.bucket();

console.log('[Firebase Storage] Initialized with bucket:', bucket.name);

export const uploadToFirebaseStorage = async (
  fileBuffer: Buffer, 
  fileName: string, 
  folder: string = 'campus-chat'
): Promise<string> => {
  try {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const uniqueFileName = `${folder}/${timestamp}-${fileName}`;
    
    console.log(`[Firebase Storage] Starting upload to: ${uniqueFileName}, buffer size: ${fileBuffer.length}`);
    
    const file = bucket.file(uniqueFileName);
    
    await file.save(fileBuffer, {
      metadata: {
        contentType: 'auto',
        cacheControl: 'public, max-age=31536000',
      },
      public: true,
    });
    
    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${uniqueFileName}`;
    
    console.log('[Firebase Storage] Upload Successful:', publicUrl);
    return publicUrl;
    
  } catch (error) {
    console.error('[Firebase Storage] Upload Error:', error);
    throw new Error(`Firebase Storage upload failed: ${error}`);
  }
};

export const deleteFromFirebaseStorage = async (fileUrl: string): Promise<void> => {
  try {
    // Extract file path from URL
    const urlParts = fileUrl.split('/');
    const bucketName = urlParts[2]; // storage.googleapis.com
    const filePath = urlParts.slice(4).join('/'); // Remove protocol and domain
    
    console.log(`[Firebase Storage] Deleting file: ${filePath}`);
    
    const file = bucket.file(filePath);
    await file.delete();
    
    console.log('[Firebase Storage] File deleted successfully');
    
  } catch (error) {
    console.error('[Firebase Storage] Delete Error:', error);
    throw new Error(`Firebase Storage delete failed: ${error}`);
  }
};

export default storage;
