import React, { useEffect } from 'react';
import { X, Download, Maximize2 } from 'lucide-react';
import { getMediaUrl } from '../utils/imageUrl';

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt?: string;
  title?: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ 
  isOpen, 
  onClose, 
  imageUrl, 
  alt = "Image", 
  title = "Image Viewer" 
}) => {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = getMediaUrl(imageUrl);
    link.download = alt || 'image';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(getMediaUrl(imageUrl), '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-6xl max-h-[90vh] w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 truncate">{title}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenInNewTab}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Open in new tab"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Download image"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="p-4 bg-gray-50 flex items-center justify-center min-h-[400px]">
          <img
            src={getMediaUrl(imageUrl)}
            alt={alt}
            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
            onClick={handleOpenInNewTab}
            style={{ cursor: 'pointer' }}
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
  );
};

export default ImageViewer;
