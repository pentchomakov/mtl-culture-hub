import { cn } from "@/lib/utils"

interface CdlSkeletonProps {
  className?: string
  variant?: "line" | "circle" | "rectangle"
}

export function CdlSkeleton({ className, variant = "rectangle" }: CdlSkeletonProps) {
  const variantClasses = {
    line: "h-3.5 w-full rounded-full",
    circle: "h-10 w-10 rounded-full",
    rectangle: "h-10 w-full rounded-md",
  }

  return (
    <div
      className={cn(
        "animate-shimmer bg-[length:200%_100%] bg-[linear-gradient(90deg,var(--color-muted)_0%,var(--color-muted)_35%,var(--color-accent)_50%,var(--color-muted)_65%,var(--color-muted)_100%)]",
        variantClasses[variant],
        className
      )}
    />
  )
}
