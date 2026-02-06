/**
 * Badge Component
 */

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  variant?: 'solid' | 'outline';
}

export default function Badge({ children, color = '#06427F', variant = 'solid' }: BadgeProps) {
  const style = variant === 'solid' 
    ? { backgroundColor: color, color: '#fff' }
    : { borderColor: color, color: color, backgroundColor: 'transparent' };

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${variant === 'outline' ? 'border' : ''}
      `}
      style={style}
    >
      {children}
    </span>
  );
}
