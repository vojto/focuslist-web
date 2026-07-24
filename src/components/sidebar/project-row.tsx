import { useCallback, useState } from "react"
import { Feedback } from "@dnd-kit/dom"
import { useSortable } from "@dnd-kit/react/sortable"
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
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState("")
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

  const startEditing = () => {
    onSelect(projectId)
    setDraft(name ?? "")
    setIsEditing(true)
  }

  const commitEdit = () => {
    setIsEditing(false)
    const trimmed = draft.trim()
    if (trimmed !== "" && trimmed !== name) {
      renameProject(db, projectId, trimmed)
    }
  }

  // Stable identity so the ref only runs when the input mounts, not on every
  // keystroke re-render.
  const initEditInput = useCallback((node: HTMLInputElement | null) => {
    if (node !== null) {
      node.focus()
      node.setSelectionRange(0, node.value.length)
    }
  }, [])

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
            ref={initEditInput}
            className="min-w-0 flex-1 bg-transparent p-0 outline-none"
            onBlur={commitEdit}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                commitEdit()
              } else if (event.key === "Escape") {
                setIsEditing(false)
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
          onDoubleClick={startEditing}
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
