export const getMediaUrl = (path: string | undefined | null) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  
  const baseUrl = 'https://campus-chat-api.com';
  // Ensure we don't end up with double slashes if path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};
