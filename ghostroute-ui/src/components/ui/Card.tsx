'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glass' | 'glow';
}

export function Card({
  children,
  className = '',
  padding = 'md',
  variant = 'default',
}: CardProps) {
  // Base styles - applied to all cards
  const baseClasses = 'rounded-lg';

  // Variant styles - background, border, shadow
  const variantClasses = {
    default: 'bg-ghost-card border border-ghost-border shadow-card',
    glass: 'bg-ghost-card/60 backdrop-blur border border-ghost-border/50',
    glow: 'bg-ghost-card border border-ghost-cyan/30 shadow-glow',
  };

  // Padding styles
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  // Combine all classes
  const cardClasses = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`;

  return (
    <div className={cardClasses}>
      {children}
    </div>
  );
}
