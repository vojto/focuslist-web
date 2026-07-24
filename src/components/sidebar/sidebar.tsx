import {
  useEditProject,
  useSelectProject,
} from "../../hooks/use-selected-project"
import { useDb } from "../../store/hooks"
import { addProject } from "../../store/operations/lists"
import ToolbarButton from "../../ui/toolbar-button"
import ProjectList from "./project-list"

export default function Sidebar() {
  const db = useDb()
  const selectProject = useSelectProject()
  const editProject = useEditProject()

  // One transaction, so the new row's first render is already in edit mode.
  const handleNewProject = () => {
    db.store.transaction(() => {
      const projectId = addProject(db)
      selectProject(projectId)
      editProject(projectId)
    })
  }

  return (
    <aside className="flex h-full min-h-0 min-w-0 flex-col bg-neutral-100">
      <div className="flex-1 overflow-y-auto px-3 pb-3 pt-6">
        <ProjectList />
      </div>

      <footer className="h-12 shrink-0 border-t border-neutral-200 bg-neutral-100 p-2">
        <ToolbarButton onClick={handleNewProject}>
          <span aria-hidden="true">＋</span>
          New project
        </ToolbarButton>
      </footer>
    </aside>
  )
}
