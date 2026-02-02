'use client';

import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  style?: React.CSSProperties;
}

export function Button({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  className = '',
  type = 'button',
  style,
}: ButtonProps) {
  const baseStyles: React.CSSProperties = {
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    fontWeight: 500,
    fontSize: '0.875rem',
    transition: 'all 0.2s',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    border: 'none',
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: { background: '#2563eb', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
    secondary: { background: '#f3f4f6', color: '#111827' },
    outline: { background: 'transparent', color: '#374151', border: '2px solid #d1d5db' },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...baseStyles, ...variants[variant], ...style }}
      className={className}
    >
      {children}
    </button>
  );
}
