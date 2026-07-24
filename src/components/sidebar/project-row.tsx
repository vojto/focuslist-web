import type { CSSProperties } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { ListId, TaskList } from "../../store/tasks/types"
import ProjectRowPreview from "./project-row-preview"

export default function ProjectRow({
  isSelected,
  onSelect,
  project,
}: {
  isSelected: boolean
  onSelect: (projectId: ListId) => void
  project: TaskList
}) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: project.id })
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <button
      ref={setNodeRef}
      aria-current={isSelected ? "true" : undefined}
      className="block w-full outline-none"
      onClick={() => onSelect(project.id)}
      style={style}
      type="button"
      {...attributes}
      {...listeners}
    >
      <ProjectRowPreview
        isSelected={isSelected}
        label={project.name}
        placeholder={isDragging}
      />
    </button>
  )
}
