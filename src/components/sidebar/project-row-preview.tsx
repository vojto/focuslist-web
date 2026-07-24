import type { ReactNode } from "react"

export default function ProjectRowPreview({
  children,
  isPlaceholder = false,
  isSelected,
  label,
}: {
  children?: ReactNode
  isPlaceholder?: boolean
  isSelected: boolean
  label: string
}) {
  const stateClass = isSelected
    ? "bg-neutral-200 text-neutral-900"
    : "text-neutral-600"

  return (
    <span
      className={`flex w-full touch-none items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-[50ms] ${stateClass}`}
    >
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
