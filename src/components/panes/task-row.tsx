import type { Todo } from "../../db"
import { deleteTodo, toggleTodo } from "../../lib/todos"

export default function TaskRow({ todo }: { todo: Todo }) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3">
      <input
        aria-label={`Mark ${todo.title} complete`}
        checked={todo.isCompleted}
        className="size-4 accent-neutral-900"
        onChange={() => {
          void toggleTodo(todo)
        }}
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
      </span>
      <button
        aria-label={`Delete ${todo.title}`}
        className="text-sm text-neutral-400 transition hover:text-red-600"
        onClick={() => {
          void deleteTodo(todo.id)
        }}
        type="button"
      >
        Delete
      </button>
    </li>
  )
}
