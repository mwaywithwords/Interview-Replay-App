import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-xl bg-gradient-to-r from-muted via-accent to-muted",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
