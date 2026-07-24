import { useDb, useValue } from "../store/hooks"
import { editProject } from "../store/operations/ui-state"
import type { ListId } from "../store/schema"

// The sidebar's counterpart to use-todo-editing: which project row is in
// inline rename. No pane to pair it with — there is only one project list.

export function useIsProjectEditing(projectId: ListId): boolean {
  return useValue("editingProjectId") === projectId
}

// Returns a callback that puts a project into inline edit mode, or leaves
// edit mode when passed undefined.
export function useEditProject() {
  const db = useDb()
  return (projectId: ListId | undefined) => {
    editProject(db, projectId)
  }
}
