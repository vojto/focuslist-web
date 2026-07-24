import { move } from "@dnd-kit/helpers"
import { DragDropProvider } from "@dnd-kit/react"
import type { DragEndEvent, DragOverEvent } from "@dnd-kit/react"
import { useRef } from "react"
import { useDb, useSliceRowIds } from "../../store/hooks"
import {
  useSelectedProjectId,
  useSelectProject,
} from "../../hooks/use-selected-project"
import { reorderProjects } from "../../store/operations/lists"
import { sealUndoStep } from "../../store/operations/undo"
import ProjectRow from "./project-row"

export default function ProjectList() {
  const db = useDb()
  const projectIds = useSliceRowIds("listsByKind", "project")
  const selectedProjectId = useSelectedProjectId()
  const selectProject = useSelectProject()
  // The store is the source of truth during the drag too: every reorder is
  // committed as it happens, and a canceled drag restores this snapshot.
  const preDragOrderRef = useRef<readonly string[] | null>(null)

  const handleDragStart = () => {
    preDragOrderRef.current = [...projectIds]
  }
  const handleDragOver = (event: DragOverEvent) => {
    reorderProjects(db, move([...projectIds], event))
  }
  const handleDragEnd = (event: DragEndEvent) => {
    if (event.canceled && preDragOrderRef.current !== null) {
      // Restoring the exact pre-drag positions leaves no net change, so the
      // checkpoint below sees nothing to seal.
      reorderProjects(db, preDragOrderRef.current)
    }
    // Seals the whole drag as one undo step (no-op when nothing changed).
    sealUndoStep(db, "Reorder projects")
    preDragOrderRef.current = null
  }

  return (
    <section aria-label="Projects">
      <div className="px-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
        Projects
      </div>

      <DragDropProvider
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <nav aria-label="Projects" className="mt-2 space-y-0.5">
          {projectIds.map((projectId, index) => (
            <ProjectRow
              index={index}
              isSelected={projectId === selectedProjectId}
              key={projectId}
              onSelect={selectProject}
              projectId={projectId}
            />
          ))}
        </nav>
      </DragDropProvider>
    </section>
  )
}
