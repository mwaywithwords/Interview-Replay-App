import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold tracking-[-0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:translate-y-px",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[var(--shadow-soft)] shadow-primary/10 hover:bg-primary/90 hover:shadow-[var(--shadow-card)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[var(--shadow-soft)] hover:bg-destructive/90",
        outline:
          "border border-border/80 bg-background/80 shadow-sm backdrop-blur hover:border-primary/25 hover:bg-accent hover:text-accent-foreground hover:shadow-[var(--shadow-soft)]",
        secondary:
          "border border-border/70 bg-secondary text-secondary-foreground shadow-sm hover:border-border hover:bg-secondary/80 hover:shadow-[var(--shadow-soft)]",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "h-auto rounded-none px-0 text-primary underline-offset-4 hover:underline",
        pill: "rounded-full border border-border/70 bg-secondary px-5 text-secondary-foreground shadow-sm hover:border-primary/25 hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-13 rounded-2xl px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

export const PrimaryButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => <Button {...props} variant="default" ref={ref} />
)
PrimaryButton.displayName = "PrimaryButton"

export const SecondaryButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => <Button {...props} variant="secondary" ref={ref} />
)
SecondaryButton.displayName = "SecondaryButton"
