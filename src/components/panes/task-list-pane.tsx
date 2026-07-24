import { useDroppable } from "@dnd-kit/core"
import { useRef, useState } from "react"
import { useFlipList } from "../../hooks/use-flip-list"
import { useCell, useDb, useSliceRowIds } from "../../store/hooks"
import { addTodo } from "../../store/operations"
import type { ListId } from "../../store/schema"
import ToolbarButton from "../../ui/toolbar-button"
import NewTaskDialog from "./new-task-dialog"
import TaskRow from "./task-row"

export default function TaskListPane({ listId }: { listId: ListId }) {
  const db = useDb()
  const kind = useCell("lists", listId, "kind")
  const name = useCell("lists", listId, "name")
  const todoIds = useSliceRowIds("todosByList", listId)
  const [isCreating, setIsCreating] = useState(false)
  // The whole task area is a drop target so drags land on empty lists and
  // below the last row.
  const { setNodeRef } = useDroppable({ id: listId })
  const listRef = useRef<HTMLUListElement>(null)
  useFlipList(listRef)
  const isToday = kind === "today"
  const backgroundClass = isToday ? "bg-white" : "bg-neutral-50"

  return (
    <section
      className={`flex h-full min-h-0 min-w-0 flex-col ${backgroundClass}`}
    >
      <div className="flex-1 overflow-y-auto p-8" ref={setNodeRef}>
        <div className="mx-auto max-w-2xl">
          <header className="mb-8 flex items-center gap-2">
            {isToday && (
              <span aria-hidden="true" className="text-xl text-amber-500">
                ★
              </span>
            )}
            <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
          </header>

          <ul className="space-y-2" ref={listRef}>
            {todoIds.map((todoId) => (
              <TaskRow key={todoId} showProject={isToday} todoId={todoId} />
            ))}
          </ul>
        </div>
      </div>

      <footer
        className={`h-12 shrink-0 border-t border-neutral-200 p-2 ${backgroundClass}`}
      >
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
