import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-[-0.01em] shadow-sm backdrop-blur-sm transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "border-primary/15 bg-primary/10 text-primary hover:bg-primary/15 hover:shadow-[var(--shadow-soft)]",
        secondary:
          "border-border/70 bg-secondary/90 text-secondary-foreground hover:border-primary/20 hover:bg-secondary",
        destructive:
          "border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/15",
        outline: "border-border/80 bg-background/60 text-foreground hover:border-primary/20 hover:bg-accent",
        success: "border-success/20 bg-success/10 text-success hover:bg-success/15",
        warning: "border-warning/25 bg-warning/10 text-warning hover:bg-warning/20",
        info: "border-info/20 bg-info/10 text-info hover:bg-info/15",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
