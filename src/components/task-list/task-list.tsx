import { CollisionPriority } from "@dnd-kit/abstract"
import { useDroppable } from "@dnd-kit/react"
import type { ReactNode } from "react"
import { useCell, useSliceRowIds } from "../../store/hooks"
import type { ListId, TodoId } from "../../store/schema"
import TaskRow from "./task-row"

// The scrollable task area of a pane. The whole area is a drop target so
// drags land on empty lists and in the padding around the rows; low
// priority lets hovered rows win.
export default function TaskList({
  header,
  listId,
  onSelectTodo,
  selectedTodoId,
  showProject = false,
}: {
  header?: ReactNode
  listId: ListId
  onSelectTodo: (todoId: TodoId) => void
  selectedTodoId: TodoId | null
  showProject?: boolean
}) {
  const name = useCell("lists", listId, "name")
  const todoIds = useSliceRowIds("todosByList", listId)
  const { ref } = useDroppable({
    id: listId,
    accept: "item",
    collisionPriority: CollisionPriority.Low,
  })

  return (
    <div className="flex-1 overflow-y-auto p-8" ref={ref}>
      <div className="mx-auto max-w-2xl">
        {header}
        <ul aria-label={name} role="listbox">
          {todoIds.map((todoId, index) => (
            <TaskRow
              index={index}
              isSelected={todoId === selectedTodoId}
              key={todoId}
              listId={listId}
              onSelect={onSelectTodo}
              showProject={showProject}
              todoId={todoId}
            />
          ))}
        </ul>
      </div>
    </div>
  )
}
