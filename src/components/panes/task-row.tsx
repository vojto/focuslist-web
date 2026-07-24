import { useTasksStore } from "../../store/tasks/store"
import type { Todo } from "../../store/tasks/types"

export default function TaskRow({
  showProject = false,
  todo,
}: {
  showProject?: boolean
  todo: Todo
}) {
  const toggleTodo = useTasksStore((state) => state.toggleTodo)
  const deleteTodo = useTasksStore((state) => state.deleteTodo)
  const projectName = useTasksStore((state) =>
    todo.projectId === undefined
      ? undefined
      : state.listsById[todo.projectId]?.name,
  )

  return (
    <li className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3">
      <input
        aria-label={`Mark ${todo.title} complete`}
        checked={todo.isCompleted}
        className="size-4 accent-neutral-900"
        onChange={() => toggleTodo(todo.id)}
        type="checkbox"
      />
      <span
        className={`flex-1 ${
          todo.isCompleted
            ? "text-neutral-400 line-through"
            : "text-neutral-800"
        }`}
      >
        {todo.title}
        {showProject && projectName !== undefined && (
          <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-medium text-neutral-500">
            {projectName}
          </span>
        )}
      </span>
      <button
        aria-label={`Delete ${todo.title}`}
        className="text-sm text-neutral-400 transition hover:text-red-600"
        onClick={() => deleteTodo(todo.id)}
        type="button"
      >
        Delete
      </button>
    </li>
  )
}
