import type { Icon as LucideIcon } from "@phosphor-icons/react"

// Theme tokens, so the disc follows dark mode. The warning icon mixes in foreground
// to reach 3:1 contrast; raw tokens, as --color-* aliases ignore a nested .dark.
const tintStyles = {
  default: "bg-muted text-muted-foreground",
  error: "bg-destructive/10 text-destructive",
  warning: "bg-warning/15 text-[color-mix(in_oklab,var(--warning)_70%,var(--foreground))]",
  success: "bg-success/10 text-success",
} as const

interface CdlEmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  variant?: keyof typeof tintStyles
  actions?: React.ReactNode
  className?: string
}

export function CdlEmptyState({
  icon: Icon,
  title,
  description,
  variant = "default",
  actions,
  className,
}: CdlEmptyStateProps) {
  return (
    <div className={`flex flex-col items-center gap-5 py-10 ${className ?? ""}`}>
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full ${tintStyles[variant]}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-center text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
