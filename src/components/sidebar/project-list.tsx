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
import {
  useSelectedProjectId,
  useSelectProject,
} from "../../hooks/use-selected-project"
import { useProjects, useTasksStore } from "../../store/tasks/store"
import ProjectRow from "./project-row"
import ProjectRowPreview from "./project-row-preview"

export default function ProjectList() {
  const projects = useProjects()
  const reorderProjects = useTasksStore((state) => state.reorderProjects)
  const selectedProjectId = useSelectedProjectId()
  const selectProject = useSelectProject()
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )
  const activeProject =
    activeProjectId === null
      ? undefined
      : projects.find((project) => project.id === activeProjectId)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveProjectId(String(event.active.id))
  }
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveProjectId(null)
    if (event.over === null) {
      return
    }
    const activeIndex = projects.findIndex(
      (project) => project.id === String(event.active.id),
    )
    const overIndex = projects.findIndex(
      (project) => project.id === String(event.over?.id),
    )
    if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
      return
    }
    reorderProjects(
      arrayMove(
        projects.map((project) => project.id),
        activeIndex,
        overIndex,
      ),
    )
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
          items={projects.map((project) => project.id)}
          strategy={verticalListSortingStrategy}
        >
          <nav aria-label="Projects" className="mt-2 space-y-0.5">
            {projects.map((project) => (
              <ProjectRow
                isSelected={project.id === selectedProjectId}
                key={project.id}
                onSelect={selectProject}
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
