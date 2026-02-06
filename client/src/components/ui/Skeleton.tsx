/**
 * Loading Skeleton Component
 */

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export default function Skeleton({ 
  className = '', 
  variant = 'rectangular',
  width,
  height
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };

  const style: React.CSSProperties = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : '100%',
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined
  };

  return (
    <div
      className={`skeleton ${variantClasses[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}
