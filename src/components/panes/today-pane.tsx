import { useState } from "react"
import { createTodo, useTodayTodos } from "../../lib/todos"
import NewTaskDialog from "./new-task-dialog"
import TaskRow from "./task-row"

export default function TodayPane() {
  const todos = useTodayTodos()
  const [isCreating, setIsCreating] = useState(false)

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
          onClick={() => setIsCreating(true)}
          type="button"
        >
          <span aria-hidden="true">＋</span>
          New task
        </button>
      </footer>

      {isCreating && (
        <NewTaskDialog
          onClose={() => setIsCreating(false)}
          onCreate={(title) => createTodo(title, { isToday: true })}
        />
      )}
    </section>
  )
}
