import { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`trip-card ${className}`}> 
      {children}
    </div>
  );
}

export function SectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{title}</h2>
      {description ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{description}</p> : null}
    </div>
  );
}
