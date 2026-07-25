import { CollisionPriority } from "@dnd-kit/abstract"
import { useDroppable } from "@dnd-kit/react"
import { useRef, type ReactNode } from "react"
import { useFlipList } from "../../hooks/use-flip-list"
import { useCell, useSliceRowIds } from "../../store/hooks"
import { clearTodoSelection } from "../../store/ui-store"
import type { ListId, PaneId } from "../../store/schema"
import TaskRow from "./task-row"

// The scrollable task area of a pane. The whole area registers as a drop
// target: placement is decided from rectangles rather than from the
// library's collisions (see use-task-dnd), and this registration is where
// the pane's rectangle comes from. The low priority keeps a hovered row
// reported as the current target, so dragover still fires row by row.
export default function TaskList({
  header,
  listId,
  paneId,
}: {
  header?: ReactNode
  listId: ListId
  paneId: PaneId
}) {
  const name = useCell("lists", listId, "name")
  const todoIds = useSliceRowIds("todosByList", listId)
  const { ref } = useDroppable({
    id: listId,
    accept: "item",
    collisionPriority: CollisionPriority.Low,
  })
  // Row reordering is animated by our own pre-paint FLIP pass; the
  // library's index transition is disabled on the rows because it animates
  // on the library's render clock, one frame behind our TinyBase-driven
  // re-renders (visible as a crossing flicker).
  const listRef = useRef<HTMLUListElement>(null)
  useFlipList(listRef)

  return (
    <div
      className="flex-1 overflow-y-auto px-5 py-8"
      ref={ref}
      // Deselect on presses that land outside any row; row presses bubble
      // up here but have already selected via the row's own handler.
      onPointerDown={(event) => {
        if (!(event.target as Element).closest('[role="option"]')) {
          clearTodoSelection()
        }
      }}
    >
      {header}
      <ul aria-label={name} ref={listRef} role="listbox">
        {todoIds.map((todoId, index) => (
          <TaskRow
            index={index}
            key={todoId}
            listId={listId}
            paneId={paneId}
            todoId={todoId}
          />
        ))}
      </ul>
    </div>
  )
}
