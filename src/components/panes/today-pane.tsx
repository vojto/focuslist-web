import { useLiveQuery } from "dexie-react-hooks"
import { db, type Todo } from "../../db"

function TaskRow({ todo }: { todo: Todo }) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3">
      <input
        aria-label={`Mark ${todo.title} complete`}
        checked={todo.isCompleted}
        className="size-4 accent-neutral-900"
        onChange={() => {
          void db.todos.update(todo.id, {
            isCompleted: !todo.isCompleted,
          })
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
          void db.todos.delete(todo.id)
        }}
        type="button"
      >
        Delete
      </button>
    </li>
  )
}

export default function TodayPane() {
  const todos = useLiveQuery(() => db.todos.toArray(), [])

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col bg-white">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-2xl">
          <header className="mb-8 flex items-center gap-2">
            <span aria-hidden="true" className="text-xl text-amber-500">
              ★
            </span>
            <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
          </header>

          <ul className="space-y-2">
            {todos?.map((todo) => (
              <TaskRow key={todo.id} todo={todo} />
            ))}
          </ul>

          {todos?.length === 0 && (
            <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-400">
              Nothing planned for today.
            </p>
          )}
        </div>
      </div>

      <footer className="h-12 shrink-0 border-t border-neutral-200 bg-white p-2">
        <button
          className="flex items-center gap-2 rounded-md px-2 py-1.5 font-medium text-neutral-500 outline-none transition active:bg-neutral-100"
          type="button"
        >
          <span aria-hidden="true">＋</span>
          New task
        </button>
      </footer>
    </section>
  )
}
