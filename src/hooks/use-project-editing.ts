import type { ListId } from "../store/schema"
import { useUiStore } from "../store/ui-store"

// The sidebar's counterpart to use-todo-editing: which project row is in
// inline rename. No pane to pair it with — there is only one project list.
export function useIsProjectEditing(projectId: ListId): boolean {
  return useUiStore((ui) => ui.editingProjectId === projectId)
}
