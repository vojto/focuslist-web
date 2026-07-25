import { useIsTodoEditing } from "../../hooks/use-todo-editing"
import { useIsTodoSelected } from "../../hooks/use-todo-selection"
import { useCell, useDb } from "../../store/hooks"
import { openEditor } from "../../store/operations/editor"
import { deleteTodo, renameTodo } from "../../store/operations/todos"
import type { ListId, PaneId, TodoId } from "../../store/schema"
import { editTodo, selectTodo, stopEditingTodo } from "../../store/ui-store"
import { ContextMenu, ContextMenuItem } from "../../ui/context-menu"
import InlineEditInput from "../../ui/inline-edit-input"
import TaskEstimateMenu from "./task-estimate-menu"
import TaskRowCard from "./task-row-card"
import { useSortableTaskRow } from "./use-sortable-task-row"
import { useTodoCompletion } from "./use-todo-completion"

export default function TaskRow({
  index,
  listId,
  paneId,
  todoId,
}: {
  index: number
  listId: ListId
  paneId: PaneId
  todoId: TodoId
}) {
  const db = useDb()
  const isSelected = useIsTodoSelected(paneId, todoId)
  const title = useCell("todos", todoId, "title")
  const isEditing = useIsTodoEditing(paneId, todoId)
  const { isCompleted, toggleTodo } = useTodoCompletion(todoId)
  // While dragging, the library floats the real row (data-dnd-dragging) and
  // keeps a cloned stand-in in the list flow (data-dnd-placeholder); the
  // data variants below style those two states. Every placement change
  // commits the real order, so the stand-in is always the true drop position.
  const ref = useSortableTaskRow({ index, listId, todoId })

  return (
    <ContextMenu
      trigger={
        <li
          ref={ref}
          className="touch-none data-[dnd-dragging]:rounded-lg data-[dnd-dragging]:bg-white data-[dnd-dragging]:shadow-lg data-[dnd-placeholder]:rounded-lg data-[dnd-placeholder]:bg-neutral-100 [&[data-dnd-placeholder]_div]:invisible"
          data-flip-id={todoId}
          // Focusable so keyboard users can select, and so the library's
          // keyboard sorting can pick the row up.
          aria-selected={isSelected}
          role="option"
          tabIndex={0}
          // Selection happens on pointer down (not click) so a task is
          // already selected when a drag starts, and stays highlighted
          // while dragged.
          onPointerDown={() => {
            selectTodo(todoId, paneId)
          }}
          // The guard keeps a fast double-toggle of the row's own controls —
          // the completion icon, the rename input — from also dropping the
          // row into edit mode.
          onDoubleClick={(event) => {
            const isOwnControl =
              event.target instanceof Element &&
              event.target.closest("button, input") !== null
            if (!isOwnControl) {
              editTodo(todoId, paneId)
            }
          }}
          // The pane behind us opens its own menu on background right-clicks;
          // keep row right-clicks from reaching it so only the row menu opens.
          onContextMenu={(event) => {
            event.stopPropagation()
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              selectTodo(todoId, paneId)
            }
          }}
        >
          {/* Both modes render the same element tree — a branch returning a
              different wrapper would remount the row and kill the css
              transition into edit mode. */}
          <TaskRowCard
            isEditing={isEditing}
            isSelected={isSelected}
            todoId={todoId}
          >
            {isEditing ? (
              <InlineEditInput
                className="min-w-0 flex-1 select-text bg-transparent p-0 text-neutral-800 outline-none"
                initialValue={title ?? ""}
                onCancel={() => {
                  stopEditingTodo()
                }}
                onCommit={(nextTitle) => {
                  if (nextTitle !== undefined) {
                    renameTodo(db, todoId, nextTitle)
                  }
                  stopEditingTodo()
                }}
              />
            ) : undefined}
          </TaskRowCard>
        </li>
      }
    >
      <ContextMenuItem
        onClick={() => {
          openEditor(db, todoId)
        }}
      >
        Open
      </ContextMenuItem>
      <ContextMenuItem onClick={toggleTodo}>
        {isCompleted ? "Mark incomplete" : "Mark complete"}
      </ContextMenuItem>
      <TaskEstimateMenu todoId={todoId} />
      <ContextMenuItem
        danger
        onClick={() => {
          deleteTodo(db, todoId)
        }}
      >
        Delete
      </ContextMenuItem>
    </ContextMenu>
  )
}
