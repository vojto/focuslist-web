import type { CSSProperties } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useCell } from "../../store/hooks"
import type { ListId } from "../../store/schema"
import ProjectRowPreview from "./project-row-preview"

export default function ProjectRow({
  isSelected,
  onSelect,
  projectId,
}: {
  isSelected: boolean
  onSelect: (projectId: ListId) => void
  projectId: ListId
}) {
  const name = useCell("lists", projectId, "name")
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: projectId })
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <button
      ref={setNodeRef}
      aria-current={isSelected ? "true" : undefined}
      className="block w-full outline-none"
      onClick={() => onSelect(projectId)}
      style={style}
      type="button"
      {...attributes}
      {...listeners}
    >
      <ProjectRowPreview
        isSelected={isSelected}
        label={name ?? ""}
        placeholder={isDragging}
      />
    </button>
  )
}
