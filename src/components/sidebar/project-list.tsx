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
import { useLiveQuery } from "dexie-react-hooks"
import { useState } from "react"
import { db } from "../../db"
import { reorderProjects } from "../../lib/reorder-projects"
import { useUiStore } from "../../stores/ui-store"
import ProjectRow from "./project-row"
import ProjectRowPreview from "./project-row-preview"

export default function ProjectList() {
  const storedProjects = useLiveQuery(
    () => db.projects.orderBy("order").toArray(),
    [],
  )
  const selectedProjectId = useUiStore((state) => state.selectedProjectId)
  const setSelectedProjectId = useUiStore((state) => state.setSelectedProjectId)
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null)
  // Drag order applied synchronously on drop, so the drop animation targets
  // the new slot while the Dexie write is still in flight.
  const [pendingOrder, setPendingOrder] = useState<number[] | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )

  // Once the live query reflects the dragged order, the override has served
  // its purpose — drop it (state adjustment during render, per React docs).
  if (
    pendingOrder !== null &&
    storedProjects?.length === pendingOrder.length &&
    storedProjects.every((project, index) => project.id === pendingOrder[index])
  ) {
    setPendingOrder(null)
  }

  const projects = (() => {
    if (storedProjects === undefined || pendingOrder === null) {
      return storedProjects
    }
    const rank = new Map(pendingOrder.map((id, index) => [id, index]))
    return [...storedProjects].sort(
      (a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity),
    )
  })()
  const activeProject =
    activeProjectId === null
      ? undefined
      : projects?.find((project) => project.id === activeProjectId)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveProjectId(Number(event.active.id))
  }
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveProjectId(null)
    if (event.over === null || projects === undefined) {
      return
    }
    const activeId = Number(event.active.id)
    const overId = Number(event.over.id)
    const activeIndex = projects.findIndex((project) => project.id === activeId)
    const overIndex = projects.findIndex((project) => project.id === overId)
    if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
      return
    }
    setPendingOrder(
      arrayMove(
        projects.map((project) => project.id),
        activeIndex,
        overIndex,
      ),
    )
    void reorderProjects(projects, activeId, overId)
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
