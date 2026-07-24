import { useDb, useValue } from "../store/hooks"
import type { ListId } from "../store/schema"

export function useSelectedProjectId(): ListId | undefined {
  return useValue("selectedProjectId")
}

// Returns a callback that selects a project, or clears the selection when
// passed undefined.
export function useSelectProject() {
  const { store } = useDb()
  return (projectId: ListId | undefined) => {
    if (projectId === undefined) {
      store.delValue("selectedProjectId")
    } else {
      store.setValue("selectedProjectId", projectId)
    }
  }
}

export function useIsProjectEditing(projectId: ListId): boolean {
  return useValue("editingProjectId") === projectId
}

// Returns a callback that puts a project into inline edit mode, or leaves
// edit mode when passed undefined. Reading the target through the store means
// a stale id (the project was deleted) is inert rather than state to clean up.
export function useEditProject() {
  const { store } = useDb()
  return (projectId: ListId | undefined) => {
    if (projectId === undefined) {
      store.delValue("editingProjectId")
    } else {
      store.setValue("editingProjectId", projectId)
    }
  }
}
