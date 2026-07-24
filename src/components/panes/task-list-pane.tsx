import { useEditTodo, useIsPaneEditing } from "../../hooks/use-todo-editing"
import { useCell, useDb } from "../../store/hooks"
import { addTodo } from "../../store/operations/todos"
import type { ListId, PaneId } from "../../store/schema"
import { ContextMenu, ContextMenuItem } from "../../ui/context-menu"
import { displayName, PROJECT_PLACEHOLDER_NAME } from "../../ui/display-name"
import ToolbarButton from "../../ui/toolbar-button"
import TaskList from "../task-list/task-list"

export default function TaskListPane({
  listId,
  paneId,
}: {
  listId: ListId
  paneId: PaneId
}) {
  const db = useDb()
  const kind = useCell("lists", listId, "kind")
  const name = useCell("lists", listId, "name")
  const isEditing = useIsPaneEditing(paneId, listId)
  const editTodo = useEditTodo(paneId)
  const isToday = kind === "today"
  // An unnamed project shows the placeholder title in gray, matching its
  // sidebar row. Today always has its name.
  const { isPlaceholder, text: title } = displayName(
    name,
    PROJECT_PLACEHOLDER_NAME,
  )

  // One transaction, so the new row's first render is already in edit mode.
  const handleNewTask = () => {
    db.store.transaction(() => {
      const todoId = addTodo(db, listId)
      if (todoId !== undefined) {
        editTodo(todoId)
      }
    })
  }

  return (
    <section
      className={`flex h-full min-h-0 min-w-0 flex-col transition-colors duration-100 ${
        isEditing ? "bg-neutral-50" : "bg-white"
      }`}
    >
      <ContextMenu
        trigger={
          <div className="flex min-h-0 flex-1 flex-col">
            <TaskList
              header={
                // px-3 matches the task card's own padding, so the title
                // text lines up with the checkboxes below it.
                <header className="mb-8 flex items-center gap-2 px-3">
                  {isToday && (
                    <span aria-hidden="true" className="text-xl text-amber-500">
                      ★
                    </span>
                  )}
                  <h1
                    className={`text-2xl font-semibold tracking-tight ${
                      isPlaceholder ? "text-neutral-400" : ""
                    }`}
                  >
                    {title}
                  </h1>
                </header>
              }
              listId={listId}
              paneId={paneId}
              showProject={isToday}
            />
          </div>
        }
      >
        <ContextMenuItem onClick={handleNewTask}>New task</ContextMenuItem>
      </ContextMenu>

      {/* No own background so the pane's edit-mode tint covers it too. */}
      <footer className="h-12 shrink-0 border-t border-neutral-200 p-2">
        <ToolbarButton onClick={handleNewTask}>
          <span aria-hidden="true">＋</span>
          New task
        </ToolbarButton>
      </footer>
    </section>
  )
}
