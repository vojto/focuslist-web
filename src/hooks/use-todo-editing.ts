import { useCell, useDb, useValue } from "../store/hooks"
import type { ListId, PaneId, TodoId } from "../store/schema"

// Both hooks read the edit target through the store, so a stale pair (the
// edited todo was deleted, or its pane now shows another list) is inert
// rather than something to clean up.

export function useIsTodoEditing(paneId: PaneId, todoId: TodoId): boolean {
  const isEditingTodo = useValue("editingTodoId") === todoId
  const isEditingPane = useValue("editingTodoPaneId") === paneId
  return isEditingTodo && isEditingPane
}

// Lets a pane tint its background while one of its rows is being edited.
export function useIsPaneEditing(paneId: PaneId, listId: ListId): boolean {
  const editingTodoId = useValue("editingTodoId")
  const isEditingPane = useValue("editingTodoPaneId") === paneId
  const editingListId = useCell("todos", editingTodoId ?? "", "listId")
  return isEditingPane && editingListId === listId
}

// Returns a callback that puts a todo into inline edit mode in the given
// pane, or leaves edit mode when passed null.
export function useEditTodo(paneId: PaneId) {
  const { store } = useDb()
  return (todoId: TodoId | null) => {
    store.transaction(() => {
      if (todoId === null) {
        store.delValue("editingTodoId")
        store.delValue("editingTodoPaneId")
      } else {
        store.setValue("editingTodoId", todoId)
        store.setValue("editingTodoPaneId", paneId)
      }
    })
  }
}
