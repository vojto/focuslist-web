import { Feedback } from "@dnd-kit/dom"
import { useSortable } from "@dnd-kit/react/sortable"
import {
  useEditProject,
  useIsProjectEditing,
  useSelectProject,
} from "../../hooks/use-selected-project"
import { useCell, useDb } from "../../store/hooks"
import { deleteProject, renameProject } from "../../store/operations/lists"
import { PROJECT_PLACEHOLDER_NAME } from "../../store/schema"
import type { ListId } from "../../store/schema"
import { ContextMenu, ContextMenuItem } from "../../ui/context-menu"
import ProjectNameInput from "./project-name-input"
import ProjectRowPreview from "./project-row-preview"

export default function ProjectRow({
  index,
  isSelected,
  onSelect,
  projectId,
}: {
  index: number
  isSelected: boolean
  onSelect: (projectId: ListId) => void
  projectId: ListId
}) {
  const db = useDb()
  const selectProject = useSelectProject()
  const name = useCell("lists", projectId, "name")
  const hasName = (name ?? "").trim() !== ""
  const displayLabel = hasName
    ? (name ?? PROJECT_PLACEHOLDER_NAME)
    : PROJECT_PLACEHOLDER_NAME
  const isEditing = useIsProjectEditing(projectId)
  const editProject = useEditProject()

  // Renaming to nothing is a no-op, so a project can stay unnamed and keep
  // showing its placeholder.
  const commitName = (nextName: string) => {
    const trimmed = nextName.trim()
    if (trimmed !== "" && trimmed !== name) {
      renameProject(db, projectId, trimmed)
    }
    editProject(undefined)
  }

  const { ref } = useSortable({
    id: projectId,
    index,
    type: "project",
    accept: "project",
    plugins: (defaults) => [
      ...defaults,
      Feedback.configure({ feedback: "clone" }),
    ],
  })

  const handleEdit = () => {
    onSelect(projectId)
    editProject(projectId)
  }

  const handleDelete = () => {
    if (isSelected) {
      selectProject(undefined)
    }
    deleteProject(db, projectId)
  }

  if (isEditing) {
    return (
      <div ref={ref} className="w-full">
        <ProjectRowPreview isSelected={isSelected} label={name ?? ""}>
          <ProjectNameInput
            initialName={name ?? ""}
            onCancel={() => {
              editProject(undefined)
            }}
            onCommit={commitName}
          />
        </ProjectRowPreview>
      </div>
    )
  }

  return (
    <ContextMenu
      trigger={
        <button
          ref={ref}
          aria-current={isSelected ? "true" : undefined}
          className="block w-full outline-none data-[dnd-dragging]:rounded-lg data-[dnd-dragging]:bg-white data-[dnd-dragging]:shadow-sm data-[dnd-placeholder]:rounded-lg data-[dnd-placeholder]:bg-neutral-200/60 [&[data-dnd-placeholder]_span]:invisible"
          onClick={() => onSelect(projectId)}
          onDoubleClick={handleEdit}
          type="button"
        >
          <ProjectRowPreview
            isPlaceholder={!hasName}
            isSelected={isSelected}
            label={displayLabel}
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
