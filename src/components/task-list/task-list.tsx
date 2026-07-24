import { CollisionPriority } from "@dnd-kit/abstract"
import { useDroppable } from "@dnd-kit/react"
import type { ReactNode } from "react"
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
      <div className="mx-auto max-w-2xl">
        {header}
        <ul aria-label={name} role="listbox">
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
    </div>
  )
}
