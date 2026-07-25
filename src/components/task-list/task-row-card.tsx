import { StickyNote } from "lucide-react"
import type { ReactNode } from "react"
import { useCell } from "../../store/hooks"
import type { TodoId } from "../../store/schema"
import { displayName, TODO_PLACEHOLDER_TITLE } from "../../ui/display-name"
import { projectIcon } from "../../ui/project-icons"
import { taskEstimate } from "../../ui/task-estimates"
import { useTodoCompletion } from "./use-todo-completion"

// The row's visual card, the task-list counterpart of ProjectRowCard. It
// reads by id, so every rendering stays in sync. Children replace the title
// label (the edit input slots in here) so the row keeps identical dimensions
// in both modes.
export default function TaskRowCard({
  children,
  isEditing = false,
  isSelected = false,
  todoId,
}: {
  children?: ReactNode
  isEditing?: boolean
  isSelected?: boolean
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

  // A completed task's icon fades with its title rather than filling in, the
  // way a checkbox would: the line through the title is what says "done", and
  // the icon is what you aim at to undo it.
  const iconClass = isCompleted
    ? "text-neutral-300"
    : "text-neutral-400 hover:text-neutral-600"

  return (
    <div
      className={`flex cursor-default select-none items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${cardClass}`}
    >
      {/* The project icon is the completion control: clicking it crosses the
          task off. The negative margin keeps the tap target bigger than the
          glyph without moving the row's layout.

          The checkbox it replaces, parked while we try this:
          <input
            aria-label={`Mark ${text} complete`}
            checked={isCompleted}
            className="size-4 shrink-0 appearance-none rounded border border-neutral-300 bg-white bg-cover bg-center bg-no-repeat transition-colors duration-100 checked:border-blue-500 checked:bg-blue-500 checked:bg-checkmark"
            onChange={toggleTodo}
            type="checkbox"
          /> */}
      <button
        aria-label={`Mark ${text} complete`}
        aria-pressed={isCompleted}
        className={`-m-1 shrink-0 rounded p-1 outline-none transition-colors ${iconClass}`}
        onClick={toggleTodo}
        type="button"
      >
        <TaskProjectIcon todoId={todoId} />
      </button>
      {/* Between the icon and the title in both modes: the rename input
          replaces only the title, so the badge stays put while typing. */}
      <TaskEstimateBadge isMuted={isCompleted} todoId={todoId} />
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

// What the task is expected to cost. Fixed width whatever it says, so the
// titles beside it line up down the list, and drawn on every row — an
// unestimated task gets the dash NO_ESTIMATE draws rather than a hole. A
// completed one fades with its title: what it was going to cost stopped
// mattering the moment it was crossed off.
function TaskEstimateBadge({
  isMuted,
  todoId,
}: {
  isMuted: boolean
  todoId: TodoId
}) {
  const estimate = taskEstimate(useCell("todos", todoId, "estimate"))

  return (
    <span
      className={`w-9 shrink-0 text-center font-medium ${estimate.className} ${isMuted ? "opacity-40" : ""}`}
    >
      {estimate.label}
    </span>
  )
}

// Which project a task came from. Every task draws one, because the glyph is
// also the row's completion control and a row cannot be missing that — a task
// created straight into Today has no project and gets the default folder.
// Its own component so resolving it stays out of the card's render.
function TaskProjectIcon({ todoId }: { todoId: TodoId }) {
  const projectId = useCell("todos", todoId, "projectId")
  const icon = projectIcon(useCell("lists", projectId ?? "", "icon"))

  return <icon.Icon aria-hidden="true" className="size-3.5" />
}
