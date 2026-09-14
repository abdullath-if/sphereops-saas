import React from 'react';

export const Skeleton = ({ className = '', variant = 'text' }) => {
  const variants = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  return (
    <div
      className={`animate-pulse bg-slate-200/80 ${variants[variant] || ''} ${className}`}
    />
  );
};

export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
    <div className="bg-slate-50 p-4 border-b border-slate-200 flex gap-4">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    <div className="divide-y divide-slate-100 p-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="p-3 flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={`h-4 flex-1 ${c === 0 ? 'w-1/3' : ''}`} />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const CardSkeleton = () => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton variant="circular" className="w-10 h-10" />
      <Skeleton className="w-16 h-6 rounded-full" />
    </div>
    <Skeleton className="w-3/4 h-5" />
    <Skeleton className="w-full h-12 rounded-lg" />
    <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
      <Skeleton className="w-20 h-4" />
      <Skeleton className="w-12 h-4" />
    </div>
  </div>
);

export default Skeleton;
