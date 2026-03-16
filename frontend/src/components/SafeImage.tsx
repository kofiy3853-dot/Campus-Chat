import React from 'react';
import { getMediaUrl } from '../utils/imageUrl';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | undefined;
  fallback?: string;
}

const SafeImage: React.FC<SafeImageProps> = ({ 
  src, 
  fallback = '/default-product.png', 
  alt, 
  className,
  ...props 
}) => {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = fallback;
    // Prevent infinite loop if fallback also fails
    target.onerror = null; 
  };

  const imageUrl = getMediaUrl(src);
  
  return (
    <img
      src={imageUrl || fallback}
      alt={alt}
      className={className}
      onError={handleImageError}
      {...props}
    />
  );
};

export default SafeImage;
