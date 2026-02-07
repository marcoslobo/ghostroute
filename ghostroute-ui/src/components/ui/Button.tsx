'use client';

import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
}: ButtonProps) {
  // Base styles - applied to all buttons
  const baseClasses = 'rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  // Variant styles - colors and effects
  const variantClasses = {
    primary: 'bg-ghost-cyan hover:bg-ghost-cyan-glow text-ghost-dark shadow-button hover:shadow-glow',
    secondary: 'bg-ghost-card hover:bg-ghost-card/80 text-foreground border border-ghost-border',
    outline: 'border-2 border-ghost-cyan text-ghost-cyan hover:bg-ghost-cyan/10 bg-transparent',
    ghost: 'hover:bg-ghost-card/50 text-foreground bg-transparent',
    destructive: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-md',
  };

  // Size styles - padding and font size
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  // Combine all classes
  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={buttonClasses}
    >
      {children}
    </button>
  );
}
