'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

export function Card({ children, className = '', padding = 'md', style }: CardProps) {
  const paddingValues: Record<string, string> = {
    none: '0',
    sm: '0.75rem',
    md: '1.25rem',
    lg: '2rem',
  };

  return (
    <div
      className={className}
      style={{
        background: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid #f3f4f6',
        padding: paddingValues[padding],
        ...style,
      }}
    >
      {children}
    </div>
  );
}
