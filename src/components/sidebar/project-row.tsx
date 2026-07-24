import { Feedback } from "@dnd-kit/dom"
import { useSortable } from "@dnd-kit/react/sortable"
import { useInlineRename } from "../../hooks/use-inline-rename"
import { useSelectProject } from "../../hooks/use-selected-project"
import { useCell, useDb } from "../../store/hooks"
import { deleteProject, renameProject } from "../../store/operations/lists"
import type { ListId } from "../../store/schema"
import { ContextMenu, ContextMenuItem } from "../../ui/context-menu"
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
  const {
    cancelEdit,
    commitEdit,
    draft,
    initInput,
    isEditing,
    setDraft,
    startEditing,
  } = useInlineRename(name, (nextName) =>
    renameProject(db, projectId, nextName),
  )
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
    startEditing()
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
          <input
            ref={initInput}
            className="min-w-0 flex-1 bg-transparent p-0 outline-none"
            onBlur={commitEdit}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                commitEdit()
              } else if (event.key === "Escape") {
                cancelEdit()
              }
            }}
            value={draft}
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
          <ProjectRowPreview isSelected={isSelected} label={name ?? ""} />
        </button>
      }
    >
      <ContextMenuItem danger onClick={handleDelete}>
        Delete
      </ContextMenuItem>
    </ContextMenu>
  )
}
