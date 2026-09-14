import React from 'react';

const colors = {
  // Statuses
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  planning: 'bg-blue-50 text-blue-700 border-blue-200',
  on_hold: 'bg-amber-50 text-amber-700 border-amber-200',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  
  // Kanban & Tasks
  todo: 'bg-slate-100 text-slate-700 border-slate-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  review: 'bg-purple-50 text-purple-700 border-purple-200',

  // Priorities
  low: 'bg-slate-50 text-slate-600 border-slate-200',
  medium: 'bg-blue-50 text-blue-600 border-blue-200',
  high: 'bg-amber-50 text-amber-700 border-amber-200',
  critical: 'bg-rose-50 text-rose-700 border-rose-200',

  // Roles
  admin: 'bg-purple-50 text-purple-700 border-purple-200',
  manager: 'bg-blue-50 text-blue-700 border-blue-200',
  employee: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const Badge = ({ children, variant = 'active', className = '', size = 'md' }) => {
  const normalizedVariant = String(variant).toLowerCase().replace(/[\s-]/g, '_');
  const colorClass = colors[normalizedVariant] || 'bg-slate-100 text-slate-700 border-slate-200';
  
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  const formattedText = typeof children === 'string' 
    ? children.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : children;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border capitalize leading-none tracking-wide ${colorClass} ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      {formattedText}
    </span>
  );
};

export default Badge;
