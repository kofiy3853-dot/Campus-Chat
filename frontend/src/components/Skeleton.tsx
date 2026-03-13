import React from 'react';
import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'circle' | 'rect' | 'text';
}

const Skeleton: React.FC<SkeletonProps> = ({ className, variant = 'rect' }) => {
  return (
    <div 
      className={clsx(
        "bg-gray-100",
        variant === 'circle' ? "rounded-full" : "rounded-xl",
        className
      )}
    />
  );
};

export default Skeleton;
