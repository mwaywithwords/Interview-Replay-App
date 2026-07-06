import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "rounded-xl bg-[linear-gradient(110deg,var(--muted)_8%,var(--accent)_18%,var(--muted)_33%)] bg-[length:200%_100%] motion-safe:animate-[replay-shimmer_1.4s_ease-in-out_infinite]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
