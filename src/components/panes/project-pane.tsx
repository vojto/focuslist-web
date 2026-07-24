import { useState } from "react"
import { useProject } from "../../lib/projects"
import { createTodo, useProjectTodos } from "../../lib/todos"
import { useUiStore } from "../../stores/ui-store"
import NewTaskDialog from "./new-task-dialog"
import TaskRow from "./task-row"

export default function ProjectPane() {
  const selectedProjectId = useUiStore((state) => state.selectedProjectId)
  const project = useProject(selectedProjectId)
  const todos = useProjectTodos(project?.id)
  const [isCreating, setIsCreating] = useState(false)

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col bg-neutral-50">
      {project ? (
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-2xl">
            <header className="mb-8">
              <h1 className="text-2xl font-semibold tracking-tight">
                {project.name}
              </h1>
            </header>

            <ul className="space-y-2">
              {todos?.map((todo) => (
                <TaskRow key={todo.id} todo={todo} />
              ))}
            </ul>

            {todos?.length === 0 && (
              <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-400">
                No tasks in this project yet.
              </p>
            )}
          </div>
        </div>
      ) : (
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
      )}

      <footer className="h-12 shrink-0 border-t border-neutral-200 bg-neutral-50 p-2">
        {project && (
          <button
            className="flex items-center gap-2 rounded-md px-2 py-1.5 font-medium text-neutral-500 outline-none transition active:bg-neutral-100"
            onClick={() => setIsCreating(true)}
            type="button"
          >
            <span aria-hidden="true">＋</span>
            New task
          </button>
        )}
      </footer>

      {isCreating && project && (
        <NewTaskDialog
          onClose={() => setIsCreating(false)}
          onCreate={(title) => createTodo(title, { projectId: project.id })}
        />
      )}
    </section>
  )
}
