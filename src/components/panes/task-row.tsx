import { useDraggable, useDroppable } from "@dnd-kit/core"
import {
  useCell,
  useDelRowCallback,
  useSetCellCallback,
} from "../../store/hooks"
import type { TodoId } from "../../store/schema"
import { ContextMenu, ContextMenuItem } from "../../ui/context-menu"

// The row's visual card. Rendered inside the sortable row, and also directly
// inside the DragOverlay (overlay) — it reads by id, so both stay in sync.
export function TaskRowCard({
  overlay = false,
  placeholder = false,
  // showProject is temporarily unused while the project badge is commented
  // out below.
  todoId,
}: {
  overlay?: boolean
  placeholder?: boolean
  showProject?: boolean
  todoId: TodoId
}) {
  const title = useCell("todos", todoId, "title")
  const isCompleted = useCell("todos", todoId, "isCompleted") === true
  // const projectId = useCell("todos", todoId, "projectId")
  // const projectName = useCell("lists", projectId ?? "", "name")
  const toggleTodo = useSetCellCallback(
    "todos",
    todoId,
    "isCompleted",
    () => (wasCompleted) => !wasCompleted,
    [],
  )

  if (title === undefined) {
    return null
  }

  const cardClass = placeholder
    ? "border-transparent bg-neutral-100"
    : overlay
      ? "border-neutral-200 bg-white shadow-lg"
      : "border-neutral-200"
  const contentClass = placeholder ? "invisible" : ""

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 ${cardClass}`}
    >
      <input
        aria-label={`Mark ${title} complete`}
        checked={isCompleted}
        className={`size-4 accent-neutral-900 ${contentClass}`}
        onChange={toggleTodo}
        type="checkbox"
      />
      <span
        className={`flex-1 ${contentClass} ${
          isCompleted ? "text-neutral-400 line-through" : "text-neutral-800"
        }`}
      >
        {title}
        {/* {showProject && projectName !== undefined && (
          <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-medium text-neutral-500">
            {projectName}
          </span>
        )} */}
      </span>
    </div>
  )
}

export default function TaskRow({
  showProject = false,
  todoId,
}: {
  showProject?: boolean
  todoId: TodoId
}) {
  // A row is a draggable (you can pick it up) and a droppable (it can be
  // hovered as a drop slot). The row itself never moves visually — while
  // dragging, it renders as the placeholder gap and the DragOverlay shows the
  // floating card. Every hover commits the real order, so the gap is always
  // the true drop position.
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef: setDraggableRef,
  } = useDraggable({ id: todoId })
  const { setNodeRef: setDroppableRef } = useDroppable({ id: todoId })
  const deleteTodo = useDelRowCallback("todos", todoId)

  return (
    <ContextMenu
      trigger={
        <li
          ref={(node) => {
            setDraggableRef(node)
            setDroppableRef(node)
          }}
          className="touch-none"
          {...attributes}
          {...listeners}
        >
          <TaskRowCard
            placeholder={isDragging}
            showProject={showProject}
            todoId={todoId}
          />
        </li>
      }
    >
      <ContextMenuItem danger onClick={deleteTodo}>
        Delete
      </ContextMenuItem>
    </ContextMenu>
  )
}
