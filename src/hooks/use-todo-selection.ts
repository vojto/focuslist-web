import { useDb, useValue } from "../store/hooks"
import type { PaneId, TodoId } from "../store/schema"

export function useIsTodoSelected(paneId: PaneId, todoId: TodoId): boolean {
  const isSelectedTodo = useValue("selectedTodoId") === todoId
  const isSelectedPane = useValue("selectedTodoPaneId") === paneId
  return isSelectedTodo && isSelectedPane
}

// Returns a callback that selects a todo in the given pane, or clears the
// app-wide selection when passed null.
export function useSelectTodo(paneId: PaneId) {
  const { store } = useDb()
  return (todoId: TodoId | null) => {
    store.transaction(() => {
      if (todoId === null) {
        store.delValue("selectedTodoId")
        store.delValue("selectedTodoPaneId")
      } else {
        store.setValue("selectedTodoId", todoId)
        store.setValue("selectedTodoPaneId", paneId)
      }
    })
  }
}
