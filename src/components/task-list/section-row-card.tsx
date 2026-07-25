import type { ReactNode } from "react"
import { useCell } from "../../store/hooks"
import type { TodoId } from "../../store/schema"
import { displayName, SECTION_PLACEHOLDER_NAME } from "../../ui/display-name"

// A section's visual heading, the task-list counterpart of TaskRowCard. It
// reads by id for the same reason, and children replace the label the same
// way, so the row keeps identical dimensions while its name is being typed.
//
// The space above it is what separates one section from the next — no rule,
// no chip. It also widens the gap a dragged card has to land in to end up
// under an empty heading, which is the only place that gap is tight.
export default function SectionRowCard({
  children,
  isSelected = false,
  todoId,
}: {
  children?: ReactNode
  isSelected?: boolean
  todoId: TodoId
}) {
  const title = useCell("todos", todoId, "title")

  if (title === undefined) {
    return null
  }

  const { isPlaceholder, text } = displayName(title, SECTION_PLACEHOLDER_NAME)
  // Blue is what separates a heading from the tasks under it — the rows are
  // all neutral, so the color does the work a rule would.
  const labelClass = isPlaceholder ? "text-blue-300" : "text-blue-600"

  return (
    <div
      className={`mt-6 flex cursor-default select-none items-center rounded-lg px-3 py-1.5 text-sm font-semibold ${
        isSelected ? "bg-indigo-50" : ""
      }`}
    >
      {children ?? <span className={`flex-1 ${labelClass}`}>{text}</span>}
    </div>
  )
}
