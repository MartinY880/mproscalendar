/**
 * Card Component
 */

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-xl shadow-card p-6
        ${hover ? 'transition-all duration-200 hover:shadow-soft hover:-translate-y-0.5' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
