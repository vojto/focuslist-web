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
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useLiveQuery } from "dexie-react-hooks"
import { useState } from "react"
import { db } from "../../db"
import { useReorderProjects } from "../../hooks/use-reorder-projects"
import { useUiStore } from "../../stores/ui-store"
import ProjectRow from "./project-row"
import ProjectRowPreview from "./project-row-preview"

export default function ProjectList() {
  const projects = useLiveQuery(
    () => db.projects.orderBy("order").toArray(),
    [],
  )
  const selectedProjectId = useUiStore((state) => state.selectedProjectId)
  const setSelectedProjectId = useUiStore((state) => state.setSelectedProjectId)
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )
  const reorderProjects = useReorderProjects(projects)
  const activeProject =
    activeProjectId === null
      ? undefined
      : projects?.find((project) => project.id === activeProjectId)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveProjectId(Number(event.active.id))
  }
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveProjectId(null)
    if (event.over === null) {
      return
    }
    void reorderProjects(Number(event.active.id), Number(event.over.id))
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
          items={projects?.map((project) => project.id) ?? []}
          strategy={verticalListSortingStrategy}
        >
          <nav aria-label="Projects" className="mt-2 space-y-0.5">
            {projects?.map((project) => (
              <ProjectRow
                isSelected={project.id === selectedProjectId}
                key={project.id}
                onSelect={setSelectedProjectId}
                project={project}
              />
            ))}
          </nav>
        </SortableContext>
        <DragOverlay>
          {activeProject === undefined ? null : (
            <ProjectRowPreview
              isSelected={activeProject.id === selectedProjectId}
              label={activeProject.name}
              overlay
            />
          )}
        </DragOverlay>
      </DndContext>
    </section>
  )
}
