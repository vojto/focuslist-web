import { useState } from "react"
import { useSelectProject } from "../../hooks/use-selected-project"
import { useDb } from "../../store/hooks"
import { addProject } from "../../store/operations"
import ToolbarButton from "../../ui/toolbar-button"
import NewProjectDialog from "./new-project-dialog"
import ProjectList from "./project-list"

export default function Sidebar() {
  const db = useDb()
  const selectProject = useSelectProject()
  const [isCreating, setIsCreating] = useState(false)

  return (
    <aside className="flex h-full min-h-0 min-w-0 flex-col bg-neutral-100">
      <div className="flex-1 overflow-y-auto px-3 pb-3 pt-6">
        <nav aria-label="Main navigation">
          <button
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-neutral-600 transition hover:bg-neutral-200/60 hover:text-neutral-900"
            type="button"
          >
            <span aria-hidden="true" className="text-amber-500">
              ★
            </span>
            Today
          </button>
        </nav>

        <ProjectList />
      </div>

      <footer className="h-12 shrink-0 border-t border-neutral-200 bg-neutral-100 p-2">
        <ToolbarButton onClick={() => setIsCreating(true)}>
          <span aria-hidden="true">＋</span>
          New project
        </ToolbarButton>
      </footer>

      {isCreating && (
        <NewProjectDialog
          onClose={() => setIsCreating(false)}
          onCreate={(name) => {
            selectProject(addProject(db, name))
          }}
        />
      )}
    </aside>
  )
}
