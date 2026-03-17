export const getMediaUrl = (path: string | undefined | null) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  
  const baseUrl = import.meta.env.VITE_API_URL || '';
  
  // If it's a legacy local upload, it should be in /uploads/
  // But first, ensure we don't have multiple slashes
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  if (cleanPath.startsWith('uploads/')) {
    return `${baseUrl}/${cleanPath}`;
  }
  
  return `${baseUrl}/uploads/${cleanPath}`;
};
