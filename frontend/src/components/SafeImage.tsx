import React, { useState } from 'react';
import { getMediaUrl } from '../utils/imageUrl';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | undefined | null;
  fallback?: string;
}

const SafeImage: React.FC<SafeImageProps> = ({ 
  src, 
  fallback = 'https://placehold.co/600x400/f8fafc/64748b?text=Image+Not+Found', 
  alt, 
  className,
  ...props 
}) => {
  const [errorCount, setErrorCount] = useState(0);
  const imageUrl = getMediaUrl(src);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (errorCount < 2) {
      const target = e.target as HTMLImageElement;
      target.src = fallback;
      setErrorCount(prev => prev + 1);
    }
  };
  
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
