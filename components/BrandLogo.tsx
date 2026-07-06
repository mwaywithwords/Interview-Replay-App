import { cn } from '@/lib/utils';

type BrandLogoSize = 'sm' | 'md' | 'lg' | 'xl';

const sizeClasses: Record<BrandLogoSize, string> = {
  sm: 'h-8 w-8 rounded-xl',
  md: 'h-9 w-9 rounded-xl',
  lg: 'h-10 w-10 rounded-2xl',
  xl: 'h-14 w-14 rounded-2xl',
};

interface BrandMarkProps {
  size?: BrandLogoSize;
  className?: string;
}

export function BrandMark({ size = 'md', className }: BrandMarkProps) {
  return (
    <img
      src="/replayai-logo.png"
      alt="ReplayAI logo"
      className={cn(
        'shrink-0 object-contain shadow-[var(--shadow-soft)]',
        sizeClasses[size],
        className
      )}
    />
  );
}
