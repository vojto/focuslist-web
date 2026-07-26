import { StickyNote } from "lucide-react"
import type { ReactNode } from "react"
import { useCell } from "../../store/hooks"
import type { ListId, TodoId } from "../../store/schema"
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
  const { isCompleted } = useTodoCompletion(todoId)

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
    ? "bg-white shadow-md transition-[background-color,box-shadow] duration-300"
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
  return (
    <div
      className={`flex cursor-default select-none items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${cardClass}`}
    >
      <TaskCompletionControl text={text} todoId={todoId} />
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
      {/* Last in both modes: the rename input replaces the title, which is
          what pushes the estimate to the edge, so it stays put while typing. */}
      <TaskEstimateBadge isMuted={isCompleted} todoId={todoId} />
    </div>
  )
}

// How a task is crossed off, which depends on the list it is showing in. A
// project list holds only that project's tasks, so which project a row came
// from is never in question and the control is a plain checkbox. Today mixes
// tasks from every project, and there the glyph saying where a row came from
// earns the spot — so it becomes the control itself rather than pushing a
// checkbox aside. One thing in the row's left column either way.
//
// A task created straight into Today belongs to no project, so it has no glyph
// to show and falls back to the checkbox: a stand-in icon there would claim a
// project the task doesn't have.
//
// The list is read off the todo rather than passed down: a row only ever
// renders in the pane showing its list, so the row already knows.
function TaskCompletionControl({
  text,
  todoId,
}: {
  text: string
  todoId: TodoId
}) {
  const listId = useCell("todos", todoId, "listId")
  const kind = useCell("lists", listId ?? "", "kind")
  const projectId = useCell("todos", todoId, "projectId")
  const { isCompleted, toggleTodo } = useTodoCompletion(todoId)

  if (kind !== "today" || projectId === undefined) {
    // Reaching here with a Today list means the task has no project, so this
    // checkbox is sitting in the same column as other rows' project glyphs.
    // Those fade to grey when completed rather than filling in, so this one
    // does too: the box stays empty and only its tick greys in. In a project
    // list nothing shares that column, and the checkbox fills in as usual.
    const checkedClass =
      kind === "today"
        ? "checked:bg-transparent checked:bg-checkmark-muted"
        : "checked:border-blue-500 checked:bg-blue-500 checked:bg-checkmark"

    return (
      <input
        aria-label={`Mark ${text} complete`}
        checked={isCompleted}
        className={`size-4 shrink-0 appearance-none rounded border border-neutral-300 bg-white bg-cover bg-center bg-no-repeat transition-colors duration-100 ${checkedClass}`}
        onChange={toggleTodo}
        type="checkbox"
      />
    )
  }

  // A completed task's icon fades with its title rather than filling in, the
  // way a checkbox would: the line through the title is what says "done", and
  // the icon is what you aim at to undo it. The negative margin keeps the tap
  // target bigger than the glyph without moving the row's layout.
  const iconClass = isCompleted
    ? "text-neutral-300"
    : "text-neutral-400 hover:text-neutral-600"

  return (
    <button
      aria-label={`Mark ${text} complete`}
      aria-pressed={isCompleted}
      className={`-m-1 shrink-0 rounded p-1 outline-none transition-colors ${iconClass}`}
      onClick={toggleTodo}
      type="button"
    >
      <TaskProjectIcon projectId={projectId} />
    </button>
  )
}

// What the task is expected to cost, parked at the row's right edge where it
// reads as a column of its own without taking width from the title. Drawn on
// every row — an unestimated task gets the dash NO_ESTIMATE draws, which is
// what says nobody has sized it yet. A completed one fades with its title:
// what it was going to cost stopped mattering the moment it was crossed off.
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
      className={`shrink-0 font-medium ${estimate.className} ${isMuted ? "opacity-40" : ""}`}
    >
      {estimate.label}
    </span>
  )
}

// Which project a task came from — drawn only in Today, where rows from
// different projects sit together and the question is worth answering. Only
// asked for a task that has a project; a project whose own icon is missing or
// unrecognized still resolves to the default folder. Its own component so
// resolving it stays out of the control's render.
function TaskProjectIcon({ projectId }: { projectId: ListId }) {
  const icon = projectIcon(useCell("lists", projectId, "icon"))

  return <icon.Icon aria-hidden="true" className="size-3.5" />
}
