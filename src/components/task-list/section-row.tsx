import { useIsTodoEditing } from "../../hooks/use-todo-editing"
import { useIsTodoSelected } from "../../hooks/use-todo-selection"
import { useCell, useDb } from "../../store/hooks"
import {
  deleteSectionWithTasks,
  deleteTodo,
  renameTodo,
} from "../../store/operations/todos"
import type { ListId, PaneId, TodoId } from "../../store/schema"
import { editTodo, selectTodo, stopEditingTodo } from "../../store/ui-store"
import { ContextMenu, ContextMenuItem } from "../../ui/context-menu"
import InlineEditInput from "../../ui/inline-edit-input"
import SectionRowCard from "./section-row-card"
import { useSortableRow } from "./use-sortable-row"

// A heading between tasks. It is a row like any other — selectable,
// draggable, renamed in place — and deliberately has no notion of what sits
// under it: the tasks in a section are whichever rows follow it, so dragging
// one across the heading is the whole of moving it between sections.
export default function SectionRow({
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
  const ref = useSortableRow({ index, listId, todoId })

  return (
    <ContextMenu
      trigger={
        <li
          ref={ref}
          className="touch-none data-[dnd-dragging]:rounded-lg data-[dnd-dragging]:bg-white data-[dnd-dragging]:shadow-lg data-[dnd-placeholder]:rounded-lg data-[dnd-placeholder]:bg-neutral-100 [&[data-dnd-placeholder]_div]:invisible"
          data-flip-id={todoId}
          data-item-type="section"
          aria-selected={isSelected}
          role="option"
          tabIndex={0}
          onPointerDown={() => {
            selectTodo(todoId, paneId)
          }}
          // The guard keeps a double-click inside the rename input from
          // dropping the row back into edit mode it is already in.
          onDoubleClick={(event) => {
            const isOwnControl =
              event.target instanceof Element &&
              event.target.closest("input") !== null
            if (!isOwnControl) {
              editTodo(todoId, paneId)
            }
          }}
          onContextMenu={(event) => {
            event.stopPropagation()
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              selectTodo(todoId, paneId)
            }
          }}
        >
          <SectionRowCard
            isEditing={isEditing}
            isSelected={isSelected}
            todoId={todoId}
          >
            {isEditing ? (
              <InlineEditInput
                className="min-w-0 flex-1 select-text bg-transparent p-0 font-semibold text-blue-600 outline-none"
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
          </SectionRowCard>
        </li>
      }
    >
      <ContextMenuItem
        onClick={() => {
          editTodo(todoId, paneId)
        }}
      >
        Rename
      </ContextMenuItem>
      {/* Two deletions, because a heading covers rows it does not own:
          taking it away on its own merges its tasks into the section above,
          which is a different thing from taking them with it. */}
      <ContextMenuItem
        danger
        onClick={() => {
          deleteTodo(db, todoId)
        }}
      >
        Delete section
      </ContextMenuItem>
      <ContextMenuItem
        danger
        onClick={() => {
          deleteSectionWithTasks(db, todoId)
        }}
      >
        Delete section and tasks
      </ContextMenuItem>
    </ContextMenu>
  )
}
