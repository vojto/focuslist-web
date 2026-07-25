import type { ReactNode } from "react"
import { useCell } from "../../store/hooks"
import type { TodoId } from "../../store/schema"
import { displayName, SECTION_PLACEHOLDER_NAME } from "../../ui/display-name"

// A section's visual heading, the task-list counterpart of TaskRowCard. It
// reads by id for the same reason, and children replace the label the same
// way, so the row keeps identical dimensions while its name is being typed.
//
// Nothing here may carry a margin. A margin on this card escapes the row's
// <li> rather than growing it, so the space would sit between rows that the
// drag reads as touching — placement follows row midlines (see
// use-task-dnd), and the FLIP pass animates from row positions. Separation
// is the heading's color; if it ever needs room, that is padding.
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

  // Renaming a heading changes nothing about how it is drawn — no lift, no
  // tint, the caret in the label is the whole of it. Writing a task is a
  // thing you sit down to; naming a heading is not, so the pane stays put.
  return (
    <div
      className={`flex cursor-default select-none items-center rounded-lg px-3 py-1.5 text-sm font-semibold ${
        isSelected ? "bg-indigo-50" : ""
      }`}
    >
      {children ?? <span className={`flex-1 ${labelClass}`}>{text}</span>}
    </div>
  )
}
