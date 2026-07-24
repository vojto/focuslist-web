import { useDb } from "../../store/hooks"
import { createProject } from "../../store/operations/lists"
import ToolbarButton from "../../ui/toolbar-button"
import ProjectList from "./project-list"

export default function Sidebar() {
  const db = useDb()

  const handleNewProject = () => {
    createProject(db)
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
