'use client';

import { SecondaryButton } from '@/components/ui/button';

export function HowItWorksButton() {
  const handleClick = () => {
    const section = document.getElementById('how-it-works');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <SecondaryButton 
      size="lg" 
      variant="ghost" 
      className="h-14 px-10 rounded-full text-lg font-bold text-muted-foreground hover:bg-accent transition-colors"
      onClick={handleClick}
    >
      How it works
    </SecondaryButton>
  );
}
