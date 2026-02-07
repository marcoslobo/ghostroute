'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    // Base classes with theme colors
    const baseClasses = 'w-full px-3 py-2 rounded-lg border bg-input text-foreground placeholder-muted-foreground';

    // Focus classes with cyan theme
    const focusClasses = 'focus:outline-none focus:ring-2 focus:ring-ghost-cyan focus:border-ghost-cyan';

    // Error or normal border
    const borderClasses = error ? 'border-destructive focus:ring-destructive' : 'border-border';

    // Disabled state
    const disabledClasses = 'disabled:opacity-50 disabled:cursor-not-allowed';

    // Combine all classes
    const inputClasses = `${baseClasses} ${focusClasses} ${borderClasses} ${disabledClasses} ${className}`;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={inputClasses}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
