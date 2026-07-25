import type { ReactNode } from "react"
import { projectIcon } from "./project-icons"

// The row's visual card, the sidebar counterpart of TaskRowCard. Children
// replace the label (the edit input slots in there) so the row keeps
// identical dimensions in both modes — the icon sits outside that swap.
export default function ProjectRowCard({
  children,
  iconName,
  isPlaceholder = false,
  isSelected,
  label,
}: {
  children?: ReactNode
  iconName: string | undefined
  isPlaceholder?: boolean
  isSelected: boolean
  label: string
}) {
  const icon = projectIcon(iconName)
  const stateClass = isSelected
    ? "bg-neutral-200 text-neutral-900"
    : "text-neutral-600"

  return (
    <span
      className={`flex w-full touch-none items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-[50ms] ${stateClass}`}
    >
      <icon.Icon aria-hidden="true" className="size-4 shrink-0 opacity-60" />

      {children ?? (
        <span
          className={`min-w-0 flex-1 truncate ${isPlaceholder ? "text-neutral-400" : ""}`}
        >
          {label}
        </span>
      )}
    </span>
  )
}
