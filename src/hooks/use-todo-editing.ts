import { useCell } from "../store/hooks"
import type { ListId, PaneId, TodoId } from "../store/schema"
import { useUiStore } from "../store/ui-store"

// Both readers resolve the edit target through the store, so a stale pair —
// the row was deleted, or its pane now shows another list — is inert rather
// than state to clean up.

export function useIsTodoEditing(paneId: PaneId, todoId: TodoId): boolean {
  return useUiStore(
    (ui) => ui.editingTodoId === todoId && ui.editingTodoPaneId === paneId,
  )
}

// Lets a pane tint its background while one of its own tasks is being edited.
// A section is excluded: naming a heading is not writing a task, and taking
// the pane down to grey for it makes a rename look like a mode you enter.
export function useIsPaneEditing(paneId: PaneId, listId: ListId): boolean {
  const editingTodoId = useUiStore((ui) => ui.editingTodoId)
  const isEditingPane = useUiStore((ui) => ui.editingTodoPaneId === paneId)
  // "" stands in for "nothing is being edited": no row has that id, so both
  // lookups miss and the pane reads as not editing.
  const editingListId = useCell("todos", editingTodoId ?? "", "listId")
  const editingType = useCell("todos", editingTodoId ?? "", "type")
  return isEditingPane && editingListId === listId && editingType === "task"
}
