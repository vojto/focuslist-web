import { useState } from "react"
import { useIsPaneEditing } from "../../hooks/use-todo-editing"
import { useCell, useDb } from "../../store/hooks"
import { addTodo } from "../../store/operations/todos"
import { PROJECT_PLACEHOLDER_NAME } from "../../store/schema"
import type { ListId, PaneId } from "../../store/schema"
import { ContextMenu, ContextMenuItem } from "../../ui/context-menu"
import ToolbarButton from "../../ui/toolbar-button"
import TaskList from "../task-list/task-list"
import NewTaskDialog from "./new-task-dialog"

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
  const [isCreating, setIsCreating] = useState(false)
  const isEditing = useIsPaneEditing(paneId)
  const isToday = kind === "today"
  // An unnamed project shows the placeholder title in gray, matching its
  // sidebar row.
  const isPlaceholderTitle = !isToday && (name ?? "").trim() === ""
  const title = isPlaceholderTitle ? PROJECT_PLACEHOLDER_NAME : name

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
                      isPlaceholderTitle ? "text-neutral-400" : ""
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
        <ContextMenuItem onClick={() => setIsCreating(true)}>
          New task
        </ContextMenuItem>
      </ContextMenu>

      {/* No own background so the pane's edit-mode tint covers it too. */}
      <footer className="h-12 shrink-0 border-t border-neutral-200 p-2">
        <ToolbarButton onClick={() => setIsCreating(true)}>
          <span aria-hidden="true">＋</span>
          New task
        </ToolbarButton>
      </footer>

      {isCreating && (
        <NewTaskDialog
          onClose={() => setIsCreating(false)}
          onCreate={(title) => addTodo(db, listId, title)}
        />
      )}
    </section>
  )
}
