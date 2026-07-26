import { useDb } from "../../store/hooks"
import { createProject } from "../../store/operations/lists"
import { ContextMenu, ContextMenuItem } from "../../ui/context-menu"
import ToolbarButton from "../../ui/toolbar-button"
import ProjectList from "./project-list"

export default function Sidebar() {
  const db = useDb()

  const handleNewProject = () => {
    createProject(db)
  }

  return (
    <aside className="flex h-full min-h-0 min-w-0 flex-col bg-neutral-100">
      {/* The pane's counterpart: right-clicking the empty space around the
          list offers what the footer button does. A project row right-clicked
          opens its own menu instead and stops the event there. */}
      <ContextMenu
        trigger={
          <div className="flex-1 overflow-y-auto px-3 pb-3 pt-6">
            <ProjectList />
          </div>
        }
      >
        <ContextMenuItem onClick={handleNewProject}>
          New project
        </ContextMenuItem>
      </ContextMenu>

      <footer className="h-12 shrink-0 border-t border-neutral-200 bg-neutral-100 p-2">
        <ToolbarButton onClick={handleNewProject}>
          <span aria-hidden="true">＋</span>
          New project
        </ToolbarButton>
      </footer>
    </aside>
  )
}
