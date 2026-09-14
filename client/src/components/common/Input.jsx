import React, { forwardRef } from 'react';

export const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      type = 'text',
      className = '',
      id,
      name,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || name || Math.random().toString(36).substring(7);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}
        <div className="relative rounded-lg shadow-sm">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <input
            id={inputId}
            name={name}
            type={type}
            ref={ref}
            required={required}
            className={`w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
              Icon ? 'pl-9' : ''
            } ${
              error
                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500'
                : 'border-slate-200 hover:border-slate-300'
            } ${className}`}
            {...props}
          />
        </div>
        {error ? (
          <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
