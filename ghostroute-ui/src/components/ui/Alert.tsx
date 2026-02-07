'use client';

import { ReactNode } from 'react';

interface AlertProps {
  children: ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'info';
  className?: string;
  onClose?: () => void;
}

export function Alert({
  children,
  variant = 'info',
  className = '',
  onClose,
}: AlertProps) {
  // Base styles - applied to all alerts
  const baseClasses = 'rounded-lg border p-4 flex items-start gap-3';

  // Variant styles - colors based on type
  const variantClasses = {
    success: 'bg-green-500/10 border-green-500/50 text-green-500',
    error: 'bg-destructive/10 border-destructive/50 text-destructive',
    warning: 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500',
    info: 'bg-ghost-cyan/10 border-ghost-cyan/50 text-ghost-cyan',
  };

  // Icons for each variant (optional - can be enhanced)
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  // Combine all classes
  const alertClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <div className={alertClasses} role="alert">
      <span className="text-lg font-bold flex-shrink-0">{icons[variant]}</span>
      <div className="flex-1">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:opacity-70 transition-opacity"
          aria-label="Close alert"
        >
          ✕
        </button>
      )}
    </div>
  );
}
