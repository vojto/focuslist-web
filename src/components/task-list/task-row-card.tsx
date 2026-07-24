import type { ReactNode } from "react"
import { useCell } from "../../store/hooks"
import type { TodoId } from "../../store/schema"
import { displayName, TODO_PLACEHOLDER_TITLE } from "../../ui/display-name"
import { useTodoCompletion } from "./use-todo-completion"

// The row's visual card, the task-list counterpart of ProjectRowCard. It
// reads by id, so every rendering stays in sync. Children replace the title
// label (the edit input slots in here) so the row keeps identical dimensions
// in both modes.
export default function TaskRowCard({
  children,
  isEditing = false,
  isSelected = false,
  // showProject is temporarily unused while the project badge is commented
  // out below.
  todoId,
}: {
  children?: ReactNode
  isEditing?: boolean
  isSelected?: boolean
  showProject?: boolean
  todoId: TodoId
}) {
  const title = useCell("todos", todoId, "title")
  const { isCompleted, toggleTodo } = useTodoCompletion(todoId)
  // const projectId = useCell("todos", todoId, "projectId")
  // const projectName = useCell("lists", projectId ?? "", "name")

  if (title === undefined) {
    return null
  }

  const { isPlaceholder, text } = displayName(title, TODO_PLACEHOLDER_TITLE)

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
      {children ?? (
        <span className={`flex-1 ${titleClass}`}>
          {text}
          {/* {showProject && projectName !== undefined && (
            <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-medium text-neutral-500">
              {projectName}
            </span>
          )} */}
        </span>
      )}
    </div>
  )
}
