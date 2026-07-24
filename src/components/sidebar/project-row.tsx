import type { CSSProperties } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useSelectProject } from "../../hooks/use-selected-project"
import { useCell, useDb } from "../../store/hooks"
import { deleteProject } from "../../store/operations"
import type { ListId } from "../../store/schema"
import { ContextMenu, ContextMenuItem } from "../../ui/context-menu"
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
  const db = useDb()
  const selectProject = useSelectProject()
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

  const handleDelete = () => {
    if (isSelected) {
      selectProject(undefined)
    }
    deleteProject(db, projectId)
  }

  return (
    <ContextMenu
      trigger={
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
      }
    >
      <ContextMenuItem danger onClick={handleDelete}>
        Delete
      </ContextMenuItem>
    </ContextMenu>
  )
}
