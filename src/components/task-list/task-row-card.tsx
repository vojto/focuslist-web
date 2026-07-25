import { StickyNote } from "lucide-react"
import type { ReactNode } from "react"
import { useCell } from "../../store/hooks"
import type { TodoId } from "../../store/schema"
import { displayName, TODO_PLACEHOLDER_TITLE } from "../../ui/display-name"
import { projectIcon } from "../../ui/project-icons"
import { useTodoCompletion } from "./use-todo-completion"

// The row's visual card, the task-list counterpart of ProjectRowCard. It
// reads by id, so every rendering stays in sync. Children replace the title
// label (the edit input slots in here) so the row keeps identical dimensions
// in both modes.
export default function TaskRowCard({
  children,
  isEditing = false,
  isSelected = false,
  showProject = false,
  todoId,
}: {
  children?: ReactNode
  isEditing?: boolean
  isSelected?: boolean
  showProject?: boolean
  todoId: TodoId
}) {
  const title = useCell("todos", todoId, "title")
  const notes = useCell("todos", todoId, "notes")
  const { isCompleted, toggleTodo } = useTodoCompletion(todoId)

  if (title === undefined) {
    return null
  }

  const { isPlaceholder, text } = displayName(title, TODO_PLACEHOLDER_TITLE)
  // Whitespace is not a note: the icon says there is something to read.
  const hasNotes = (notes ?? "").trim() !== ""

  // The transition class rides along only in the editing state, so entering
  // edit mode animates but selection changes snap. It's scoped to
  // color/shadow — transitioning transform would fight the FLIP reorder
  // animation.
  const cardClass = isEditing
    ? "bg-white shadow-md transition-[background-color,box-shadow] duration-100"
    : isSelected
      ? "bg-indigo-50"
      : ""

  const titleClass = isCompleted
    ? "text-neutral-400 line-through"
    : isPlaceholder
      ? "text-neutral-400"
      : "text-neutral-800"

  return (
    <div
      className={`flex cursor-default select-none items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${cardClass}`}
    >
      <input
        aria-label={`Mark ${text} complete`}
        checked={isCompleted}
        className="size-4 shrink-0 appearance-none rounded border border-neutral-300 bg-white bg-cover bg-center bg-no-repeat transition-colors duration-100 checked:border-blue-500 checked:bg-blue-500 checked:bg-checkmark"
        onChange={toggleTodo}
        type="checkbox"
      />
      {showProject && <TaskProjectIcon todoId={todoId} />}
      {children ?? (
        <span className={`flex-1 ${titleClass}`}>
          {text}
          {/* Rides inside the title, so the inline rename — which replaces
              this whole span — takes it off screen for as long as it lasts. */}
          {hasNotes && (
            <StickyNote
              aria-label="Has notes"
              className="ml-1.5 inline size-3 align-middle text-neutral-400"
              role="img"
            />
          )}
        </span>
      )}
    </div>
  )
}

// Which project a task came from, worth showing only where that is not already
// obvious — the Today pane, the one place tasks from different projects sit
// together, which is what showProject means above. Its own component so the
// panes that don't show it subscribe to nothing: a task created straight into
// Today belongs to no project and draws nothing at all rather than a default.
function TaskProjectIcon({ todoId }: { todoId: TodoId }) {
  const projectId = useCell("todos", todoId, "projectId")
  const icon = projectIcon(useCell("lists", projectId ?? "", "icon"))

  if (projectId === undefined) {
    return null
  }

  return (
    <icon.Icon
      aria-hidden="true"
      className="size-3.5 shrink-0 text-neutral-400"
    />
  )
}
