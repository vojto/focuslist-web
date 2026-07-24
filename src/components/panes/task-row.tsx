import {
  useCell,
  useDelRowCallback,
  useSetCellCallback,
} from "../../store/hooks"
import type { TodoId } from "../../store/schema"

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

  return (
    <li className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3">
      <input
        aria-label={`Mark ${title} complete`}
        checked={isCompleted}
        className="size-4 accent-neutral-900"
        onChange={toggleTodo}
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
        onClick={deleteTodo}
        type="button"
      >
        Delete
      </button>
    </li>
  )
}
