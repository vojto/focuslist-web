import { useDb, useValue } from "../store/hooks"
import { clearTodoSelection, selectTodo } from "../store/operations/ui-state"
import type { PaneId, TodoId } from "../store/schema"

export function useIsTodoSelected(paneId: PaneId, todoId: TodoId): boolean {
  const isSelectedTodo = useValue("selectedTodoId") === todoId
  const isSelectedPane = useValue("selectedTodoPaneId") === paneId
  return isSelectedTodo && isSelectedPane
}

// Returns a callback that selects a todo in the given pane, or clears the
// app-wide selection when passed undefined.
export function useSelectTodo(paneId: PaneId) {
  const db = useDb()
  return (todoId: TodoId | undefined) => {
    if (todoId === undefined) {
      clearTodoSelection(db)
    } else {
      selectTodo(db, todoId, paneId)
    }
  }
}
