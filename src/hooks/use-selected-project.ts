import { useDb, useValue } from "../store/hooks"
import { selectProject } from "../store/operations/ui-state"
import type { ListId } from "../store/schema"

export function useSelectedProjectId(): ListId | undefined {
  return useValue("selectedProjectId")
}

// Returns a callback that selects a project, or clears the selection when
// passed undefined.
export function useSelectProject() {
  const db = useDb()
  return (projectId: ListId | undefined) => {
    selectProject(db, projectId)
  }
}
