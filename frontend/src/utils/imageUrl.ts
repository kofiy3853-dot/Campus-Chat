export const getMediaUrl = (path: string | undefined | null) => {
  if (!path) return '';
  
  // If it's already a full URL (http, https, data:, or Firebase storage URL), return as-is
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('https://storage.googleapis.com')) {
    return path;
  }
  
  const baseUrl = import.meta.env.VITE_API_URL || '';
  
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // For Firebase URLs, they're already full URLs, so just return them
  if (cleanPath.startsWith('campus-chat/') {
    return `https://storage.googleapis.com/${process.env.VITE_FIREBASE_STORAGE_BUCKET || 'campus-networking.appspot.com'}/${cleanPath}`;
  }
  
  // For legacy local uploads, add uploads/ prefix
  return `${baseUrl}/uploads/${cleanPath}`;
};
