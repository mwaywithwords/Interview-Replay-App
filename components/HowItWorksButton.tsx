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
      className="h-14 rounded-full border border-border/70 bg-background/60 px-8 text-base font-semibold text-muted-foreground shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:bg-accent hover:text-foreground"
      onClick={handleClick}
    >
      How it works
    </SecondaryButton>
  );
}
