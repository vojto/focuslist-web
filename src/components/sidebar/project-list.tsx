import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useState } from "react"
import { useCell, useDb, useSliceRowIds } from "../../store/hooks"
import {
  useSelectedProjectId,
  useSelectProject,
} from "../../hooks/use-selected-project"
import { reorderProjects } from "../../store/operations"
import ProjectRow from "./project-row"
import ProjectRowPreview from "./project-row-preview"

export default function ProjectList() {
  const db = useDb()
  const projectIds = useSliceRowIds("listsByKind", "project")
  const selectedProjectId = useSelectedProjectId()
  const selectProject = useSelectProject()
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const activeProjectName = useCell("lists", activeProjectId ?? "", "name")
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveProjectId(String(event.active.id))
  }
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveProjectId(null)
    if (event.over === null) {
      return
    }
    const activeIndex = projectIds.indexOf(String(event.active.id))
    const overIndex = projectIds.indexOf(String(event.over.id))
    if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
      return
    }
    reorderProjects(db, arrayMove([...projectIds], activeIndex, overIndex))
  }
  const handleDragCancel = () => {
    setActiveProjectId(null)
  }

  return (
    <section aria-label="Projects">
      <div className="mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
        Projects
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext
          items={[...projectIds]}
          strategy={verticalListSortingStrategy}
        >
          <nav aria-label="Projects" className="mt-2 space-y-0.5">
            {projectIds.map((projectId) => (
              <ProjectRow
                isSelected={projectId === selectedProjectId}
                key={projectId}
                onSelect={selectProject}
                projectId={projectId}
              />
            ))}
          </nav>
        </SortableContext>
        <DragOverlay>
          {activeProjectName === undefined ? null : (
            <ProjectRowPreview
              isSelected={activeProjectId === selectedProjectId}
              label={activeProjectName}
              overlay
            />
          )}
        </DragOverlay>
      </DndContext>
    </section>
  )
}
