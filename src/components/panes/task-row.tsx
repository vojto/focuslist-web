import { useCell } from "../../db"
import { deleteTodo, toggleTodo } from "../../lib/task-operations"
import type { TodoId } from "../../types"

export default function TaskRow({
  showProject = false,
  todoId,
}: {
  showProject?: boolean
  todoId: TodoId
}) {
  const title = useCell("todos", todoId, "title")
  const isCompleted = useCell("todos", todoId, "isCompleted") === true
  const projectId = useCell("todos", todoId, "projectId")
  const projectName = useCell("lists", projectId ?? "", "name")

  if (title === undefined) {
    return null
  }

  return (
    <li className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3">
      <input
        aria-label={`Mark ${title} complete`}
        checked={isCompleted}
        className="size-4 accent-neutral-900"
        onChange={() => toggleTodo(todoId)}
        type="checkbox"
      />
      <span
        className={`flex-1 ${
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
        className="text-sm text-neutral-400 transition hover:text-red-600"
        onClick={() => deleteTodo(todoId)}
        type="button"
      >
        Delete
      </button>
    </li>
  )
}
