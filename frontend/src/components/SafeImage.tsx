import React, { useState, useEffect } from 'react';
import { getMediaUrl } from '../utils/imageUrl';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | undefined;
  fallback?: string;
  enableViewer?: boolean; // New prop to enable image viewer
}

const SafeImage: React.FC<SafeImageProps> = ({ 
  src, 
  fallback = 'https://placehold.co/600x400/f8fafc/64748b?text=Image+Not+Found', 
  alt, 
  className,
  enableViewer = true, // Enable viewer by default
  ...props 
}) => {
  const [errorCount, setErrorCount] = useState(0);
  const [showViewer, setShowViewer] = useState(false);
  const imageUrl = getMediaUrl(src || undefined);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowViewer(false);
      }
    };

    if (showViewer) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showViewer]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (errorCount < 2) {
      const target = e.target as HTMLImageElement;
      target.src = fallback;
      setErrorCount(prev => prev + 1);
    }
  };

  const handleImageClick = () => {
    if (enableViewer && imageUrl && imageUrl !== fallback) {
      setShowViewer(true);
    }
  };

  return (
    <>
      <img
        src={imageUrl || fallback}
        alt={alt}
        className={className}
        onClick={handleImageClick}
        style={{ cursor: enableViewer && imageUrl !== fallback ? 'pointer' : 'default' }}
        onError={handleImageError}
        {...props}
      />
      
      {/* Image Viewer Modal */}
      {showViewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-6xl max-h-[90vh] w-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 truncate">Image Viewer</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.open(imageUrl, '_blank')}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Open in new tab"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 6z" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = imageUrl;
                    link.download = alt || 'image';
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Download image"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 15 15" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowViewer(false)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Image */}
            <div className="p-4 bg-gray-50 flex items-center justify-center min-h-[400px]">
              <img
                src={imageUrl}
                alt={alt}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
              />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600 text-center">
                Click image to open in new tab • Press ESC to close
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SafeImage;
