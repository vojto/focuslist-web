import { Feedback } from "@dnd-kit/dom"
import { useSortable } from "@dnd-kit/react/sortable"
import { useIsProjectEditing } from "../../hooks/use-project-editing"
import { useCell, useDb } from "../../store/hooks"
import { deleteProject, renameProject } from "../../store/operations/lists"
import type { ListId } from "../../store/schema"
import {
  editProject,
  openIconPicker,
  selectProject,
} from "../../store/ui-store"
import { ContextMenu, ContextMenuItem } from "../../ui/context-menu"
import { displayName, PROJECT_PLACEHOLDER_NAME } from "../../ui/display-name"
import InlineEditInput from "../../ui/inline-edit-input"
import ProjectRowCard from "./project-row-card"

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
  const name = useCell("lists", projectId, "name")
  const iconName = useCell("lists", projectId, "icon")
  const { isPlaceholder, text } = displayName(name, PROJECT_PLACEHOLDER_NAME)
  const isEditing = useIsProjectEditing(projectId)

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

  // Selecting first, as renaming does: the row you are dressing up should be
  // the row the app is showing.
  const handleChangeIcon = () => {
    onSelect(projectId)
    openIconPicker(projectId)
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
        <ProjectRowCard
          iconName={iconName}
          isSelected={isSelected}
          label={name ?? ""}
        >
          <InlineEditInput
            className="min-w-0 flex-1 bg-transparent p-0 outline-none"
            initialValue={name ?? ""}
            onCancel={() => {
              editProject(undefined)
            }}
            onCommit={(nextName) => {
              if (nextName !== undefined) {
                renameProject(db, projectId, nextName)
              }
              editProject(undefined)
            }}
          />
        </ProjectRowCard>
      </div>
    )
  }

  return (
    <ContextMenu
      trigger={
        <button
          ref={ref}
          aria-current={isSelected ? "true" : undefined}
          className="block w-full outline-none data-[dnd-dragging]:rounded-lg data-[dnd-dragging]:bg-white data-[dnd-dragging]:shadow-sm data-[dnd-placeholder]:rounded-lg data-[dnd-placeholder]:bg-neutral-200/60 [&[data-dnd-placeholder]_:is(span,svg)]:invisible"
          onClick={() => onSelect(projectId)}
          onDoubleClick={handleEdit}
          type="button"
        >
          <ProjectRowCard
            iconName={iconName}
            isPlaceholder={isPlaceholder}
            isSelected={isSelected}
            label={text}
          />
        </button>
      }
    >
      <ContextMenuItem onClick={handleChangeIcon}>Change Icon…</ContextMenuItem>
      <ContextMenuItem danger onClick={handleDelete}>
        Delete
      </ContextMenuItem>
    </ContextMenu>
  )
}
