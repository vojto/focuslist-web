import type { PaneId, TodoId } from "../store/schema"
import { useUiStore } from "../store/ui-store"

export function useIsTodoSelected(paneId: PaneId, todoId: TodoId): boolean {
  return useUiStore(
    (ui) => ui.selectedTodoId === todoId && ui.selectedTodoPaneId === paneId,
  )
}
