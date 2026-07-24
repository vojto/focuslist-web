import { useState } from "react"
import {
  TODAY_LIST_ID,
  useListTodos,
  useTasksStore,
} from "../../stores/use-tasks-store"
import ToolbarButton from "../../ui/toolbar-button"
import NewTaskDialog from "./new-task-dialog"
import TaskRow from "./task-row"

export default function TodayPane() {
  const todos = useListTodos(TODAY_LIST_ID)
  const addTodo = useTasksStore((state) => state.addTodo)
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
              <TaskRow key={todo.id} showProject todo={todo} />
            ))}
          </ul>
        </div>
      </div>

      <footer className="h-12 shrink-0 border-t border-neutral-200 bg-white p-2">
        <ToolbarButton onClick={() => setIsCreating(true)}>
          <span aria-hidden="true">＋</span>
          New task
        </ToolbarButton>
      </footer>

      {isCreating && (
        <NewTaskDialog
          onClose={() => setIsCreating(false)}
          onCreate={(title) => addTodo(TODAY_LIST_ID, title)}
        />
      )}
    </section>
  )
}
