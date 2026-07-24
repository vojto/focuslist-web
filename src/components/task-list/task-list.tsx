import { CollisionPriority } from "@dnd-kit/abstract"
import { useDroppable } from "@dnd-kit/react"
import { useRef, type ReactNode } from "react"
import { useFlipList } from "../../hooks/use-flip-list"
import { useSelectTodo } from "../../hooks/use-todo-selection"
import { useCell, useSliceRowIds } from "../../store/hooks"
import type { ListId, PaneId } from "../../store/schema"
import TaskRow from "./task-row"

// The scrollable task area of a pane. The whole area is a drop target so
// drags land on empty lists and in the padding around the rows; low
// priority lets hovered rows win.
export default function TaskList({
  header,
  listId,
  paneId,
  showProject = false,
}: {
  header?: ReactNode
  listId: ListId
  paneId: PaneId
  showProject?: boolean
}) {
  const name = useCell("lists", listId, "name")
  const todoIds = useSliceRowIds("todosByList", listId)
  const selectTodo = useSelectTodo(paneId)
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
      className="flex-1 overflow-y-auto p-8"
      ref={ref}
      // Deselect on presses that land outside any row; row presses bubble
      // up here but have already selected via the row's own handler.
      onPointerDown={(event) => {
        if (!(event.target as Element).closest('[role="option"]')) {
          selectTodo(null)
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
            showProject={showProject}
            todoId={todoId}
          />
        ))}
      </ul>
    </div>
  )
}
