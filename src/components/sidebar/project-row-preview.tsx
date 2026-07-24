export default function ProjectRowPreview({
  isSelected,
  label,
  overlay = false,
  placeholder = false,
}: {
  isSelected: boolean
  label: string
  overlay?: boolean
  placeholder?: boolean
}) {
  const stateClass = placeholder
    ? "bg-neutral-200/60 text-transparent"
    : overlay
      ? "bg-white text-neutral-900 shadow-sm"
      : isSelected
        ? "bg-neutral-200 text-neutral-900"
        : "text-neutral-600"

  return (
    <span
      className={`flex w-full touch-none items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-[50ms] ${stateClass}`}
    >
      <span
        className={`min-w-0 flex-1 truncate ${placeholder ? "invisible" : ""}`}
      >
        {label}
      </span>
    </span>
  )
}
