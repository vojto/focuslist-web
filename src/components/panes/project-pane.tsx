import { useState } from "react"
import { useCell, useDb, useSliceRowIds } from "../../store/hooks"
import { useSelectedProjectId } from "../../hooks/use-selected-project"
import { addTodo } from "../../store/operations"
import ToolbarButton from "../../ui/toolbar-button"
import NewTaskDialog from "./new-task-dialog"
import TaskRow from "./task-row"

export default function ProjectPane() {
  const db = useDb()
  const selectedProjectId = useSelectedProjectId()
  const projectName = useCell("lists", selectedProjectId ?? "", "name")
  const todoIds = useSliceRowIds("todosByList", selectedProjectId ?? "")
  const [isCreating, setIsCreating] = useState(false)
  const project =
    selectedProjectId !== undefined && projectName !== undefined
      ? { id: selectedProjectId, name: projectName }
      : undefined

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
              {todoIds.map((todoId) => (
                <TaskRow key={todoId} todoId={todoId} />
              ))}
            </ul>
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
          <ToolbarButton onClick={() => setIsCreating(true)}>
            <span aria-hidden="true">＋</span>
            New task
          </ToolbarButton>
        )}
      </footer>

      {isCreating && project && (
        <NewTaskDialog
          onClose={() => setIsCreating(false)}
          onCreate={(title) => addTodo(db, project.id, title)}
        />
      )}
    </section>
  )
}
