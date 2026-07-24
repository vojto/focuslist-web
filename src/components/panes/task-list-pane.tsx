import { useState } from "react"
import { useCell, useDb } from "../../store/hooks"
import { addTodo } from "../../store/operations/todos"
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
  const isToday = kind === "today"

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col bg-white">
      <ContextMenu
        trigger={
          <div className="flex min-h-0 flex-1 flex-col">
            <TaskList
              header={
                <header className="mb-8 flex items-center gap-2">
                  {isToday && (
                    <span aria-hidden="true" className="text-xl text-amber-500">
                      ★
                    </span>
                  )}
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {name}
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

      <footer className="h-12 shrink-0 border-t border-neutral-200 bg-white p-2">
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
