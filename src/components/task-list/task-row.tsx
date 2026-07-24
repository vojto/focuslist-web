import { Feedback } from "@dnd-kit/dom"
import { useSortable } from "@dnd-kit/react/sortable"
import {
  useCell,
  useDelRowCallback,
  useSetCellCallback,
} from "../../store/hooks"
import type { ListId, TodoId } from "../../store/schema"
import { ContextMenu, ContextMenuItem } from "../../ui/context-menu"

// The row's visual card. It reads by id, so every rendering stays in sync.
export function TaskRowCard({
  isSelected = false,
  // showProject is temporarily unused while the project badge is commented
  // out below.
  todoId,
}: {
  isSelected?: boolean
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

  const cardClass = isSelected ? "bg-blue-50" : ""

  return (
    <div className={`flex items-center gap-3 rounded-lg p-3 ${cardClass}`}>
      <input
        aria-label={`Mark ${title} complete`}
        checked={isCompleted}
        className="size-4 accent-neutral-900"
        onChange={toggleTodo}
        type="checkbox"
      />
      <span
        className={`flex-1 ${
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
  index,
  isSelected = false,
  listId,
  onSelect,
  showProject = false,
  todoId,
}: {
  index: number
  isSelected?: boolean
  listId: ListId
  onSelect: (todoId: TodoId) => void
  showProject?: boolean
  todoId: TodoId
}) {
  // While dragging, the library floats the real row (data-dnd-dragging) and
  // keeps a cloned stand-in in the list flow (data-dnd-placeholder); the
  // data variants below style those two states. Every placement change
  // commits the real order, so the stand-in is always the true drop position.
  const { ref } = useSortable({
    id: todoId,
    index,
    group: listId,
    type: "item",
    accept: "item",
    // 0.5.0 has no top-level `feedback` input; it is per-entity plugin
    // config (the SortableInput docs show exactly this pattern).
    plugins: (defaults) => [
      ...defaults,
      Feedback.configure({ feedback: "clone" }),
    ],
  })
  const deleteTodo = useDelRowCallback("todos", todoId)

  return (
    <ContextMenu
      trigger={
        <li
          ref={ref}
          className="touch-none data-[dnd-dragging]:rounded-lg data-[dnd-dragging]:bg-white data-[dnd-dragging]:shadow-lg data-[dnd-placeholder]:rounded-lg data-[dnd-placeholder]:bg-neutral-100 [&[data-dnd-placeholder]_div]:invisible"
          // Focusable so keyboard users can select, and so the library's
          // keyboard sorting can pick the row up.
          aria-selected={isSelected}
          role="option"
          tabIndex={0}
          // Selection happens on pointer down (not click) so a task is
          // already selected when a drag starts, and stays highlighted
          // while dragged.
          onPointerDown={() => onSelect(todoId)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSelect(todoId)
            }
          }}
        >
          <TaskRowCard
            isSelected={isSelected}
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
