import { Badge, badgeVariants } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { VariantProps } from "class-variance-authority"

type CdlBadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean
    size?: "default" | "xs"
  }

export function CdlBadge({ size = "default", className, ...props }: CdlBadgeProps) {
  return (
    <Badge
      className={cn(
        "rounded",
        size === "xs" && "text-[10px] px-1.5 py-px [&>svg]:size-2.5",
        className,
      )}
      {...props}
    />
  )
}
