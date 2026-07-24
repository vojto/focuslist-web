import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { CSSProperties } from "react"
import {
  useCell,
  useDelRowCallback,
  useSetCellCallback,
} from "../../store/hooks"
import type { TodoId } from "../../store/schema"

// The row's visual card. Rendered inside the sortable row, and also directly
// inside the DragOverlay (overlay) — it reads by id, so both stay in sync.
export function TaskRowCard({
  overlay = false,
  placeholder = false,
  showProject = false,
  todoId,
}: {
  overlay?: boolean
  placeholder?: boolean
  showProject?: boolean
  todoId: TodoId
}) {
  const title = useCell("todos", todoId, "title")
  const isCompleted = useCell("todos", todoId, "isCompleted") === true
  const projectId = useCell("todos", todoId, "projectId")
  const projectName = useCell("lists", projectId ?? "", "name")
  const toggleTodo = useSetCellCallback(
    "todos",
    todoId,
    "isCompleted",
    () => (wasCompleted) => !wasCompleted,
    [],
  )
  const deleteTodo = useDelRowCallback("todos", todoId)

  if (title === undefined) {
    return null
  }

  const cardClass = placeholder
    ? "border-transparent bg-neutral-100"
    : overlay
      ? "border-neutral-200 bg-white shadow-lg"
      : "border-neutral-200"
  const contentClass = placeholder ? "invisible" : ""

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 ${cardClass}`}
    >
      <input
        aria-label={`Mark ${title} complete`}
        checked={isCompleted}
        className={`size-4 accent-neutral-900 ${contentClass}`}
        onChange={toggleTodo}
        type="checkbox"
      />
      <span
        className={`flex-1 ${contentClass} ${
          isCompleted ? "text-neutral-400 line-through" : "text-neutral-800"
        }`}
      >
        {title}
        {showProject && projectName !== undefined && (
          <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-medium text-neutral-500">
            {projectName}
          </span>
        )}
      </span>
      <button
        aria-label={`Delete ${title}`}
        className={`text-sm text-neutral-400 transition hover:text-red-600 ${contentClass}`}
        onClick={deleteTodo}
        type="button"
      >
        Delete
      </button>
    </div>
  )
}

export default function TaskRow({
  showProject = false,
  todoId,
}: {
  showProject?: boolean
  todoId: TodoId
}) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: todoId })
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      className="touch-none"
      style={style}
      {...attributes}
      {...listeners}
    >
      <TaskRowCard
        placeholder={isDragging}
        showProject={showProject}
        todoId={todoId}
      />
    </li>
  )
}
