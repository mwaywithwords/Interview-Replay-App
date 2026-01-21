import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center border border-dashed border-slate-300 rounded-2xl bg-slate-100/30 transition-all">
      {Icon && (
        <div className="w-20 h-20 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-6">
          <Icon className="w-10 h-10 text-slate-500" />
        </div>
      )}
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 max-w-sm mb-8 leading-relaxed font-medium">{description}</p>
      {action && (
        <div className="animate-in fade-in zoom-in duration-300">
          {action}
        </div>
      )}
    </div>
  );
}
