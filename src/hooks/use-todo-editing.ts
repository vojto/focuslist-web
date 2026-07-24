import { useCell, useDb, useValue } from "../store/hooks"
import { editTodo, stopEditingTodo } from "../store/operations/ui-state"
import type { ListId, PaneId, TodoId } from "../store/schema"

// Both readers resolve the edit target through the store, so a stale pair —
// the row was deleted, or its pane now shows another list — is inert rather
// than state to clean up.

export function useIsTodoEditing(paneId: PaneId, todoId: TodoId): boolean {
  const isEditingTodo = useValue("editingTodoId") === todoId
  const isEditingPane = useValue("editingTodoPaneId") === paneId
  return isEditingTodo && isEditingPane
}

// Lets a pane tint its background while one of its own rows is being edited.
export function useIsPaneEditing(paneId: PaneId, listId: ListId): boolean {
  const editingTodoId = useValue("editingTodoId")
  const isEditingPane = useValue("editingTodoPaneId") === paneId
  // "" stands in for "nothing is being edited": no row has that id, so the
  // lookup misses and the pane reads as not editing.
  const editingListId = useCell("todos", editingTodoId ?? "", "listId")
  return isEditingPane && editingListId === listId
}

// Returns a callback that puts a todo into inline edit mode in the given
// pane, or leaves edit mode when passed undefined.
export function useEditTodo(paneId: PaneId) {
  const db = useDb()
  return (todoId: TodoId | undefined) => {
    if (todoId === undefined) {
      stopEditingTodo(db)
    } else {
      editTodo(db, todoId, paneId)
    }
  }
}
