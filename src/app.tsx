import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";

export default function App() {
  const todos = useLiveQuery(() => db.todos.toArray(), []);

  return (
    <main className="grid h-dvh w-screen grid-cols-[14rem_minmax(0,1fr)_minmax(0,1fr)] overflow-hidden bg-white">
      <aside className="flex min-h-0 min-w-0 flex-col border-r border-neutral-200 bg-neutral-100">
        <div className="flex-1 overflow-y-auto px-3 pb-3 pt-6">
          <nav aria-label="Main navigation">
            <button
              className="flex w-full items-center gap-2 rounded-lg bg-neutral-200 px-3 py-2 text-left text-sm font-medium"
              type="button"
            >
              <span aria-hidden="true" className="text-amber-500">
                ★
              </span>
              Today
            </button>
          </nav>

          <div className="mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Projects
          </div>
        </div>

        <footer className="h-12 shrink-0 border-t border-neutral-200 bg-neutral-100 p-2">
          <button
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left font-medium text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-800"
            type="button"
          >
            <span aria-hidden="true">＋</span>
            New project
          </button>
        </footer>
      </aside>

      <section className="flex min-h-0 min-w-0 flex-col border-r border-neutral-200">
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
                <li
                  className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3"
                  key={todo.id}
                >
                  <input
                    aria-label={`Mark ${todo.title} complete`}
                    checked={todo.isCompleted}
                    className="size-4 accent-neutral-900"
                    onChange={() =>
                      db.todos.update(todo.id, {
                        isCompleted: !todo.isCompleted,
                      })
                    }
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
                    onClick={() => db.todos.delete(todo.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </li>
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
            className="flex items-center gap-2 rounded-md px-2 py-1.5 font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800"
            type="button"
          >
            <span aria-hidden="true">＋</span>
            New task
          </button>
        </footer>
      </section>

      <section className="flex min-h-0 min-w-0 flex-col bg-neutral-50">
        <div className="grid flex-1 place-items-center overflow-y-auto p-8">
          <div className="text-center">
            <p className="text-sm font-medium text-neutral-500">
              No project selected
            </p>
            <p className="mt-1 text-sm text-neutral-400">
              Choose a project from the sidebar.
            </p>
          </div>
        </div>

        <footer
          aria-hidden="true"
          className="h-12 shrink-0 border-t border-neutral-200 bg-neutral-50"
        />
      </section>
    </main>
  );
}
