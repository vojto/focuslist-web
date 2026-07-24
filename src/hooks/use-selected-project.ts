import { useCallback } from "react"
import { useDb, useValue } from "../store/hooks"
import type { ListId } from "../store/schema"

export function useSelectedProjectId(): ListId | undefined {
  return useValue("selectedProjectId")
}

// Returns a callback that selects a project, or clears the selection when
// passed undefined.
export function useSelectProject() {
  const { store } = useDb()
  return useCallback(
    (projectId: ListId | undefined) => {
      if (projectId === undefined) {
        store.delValue("selectedProjectId")
      } else {
        store.setValue("selectedProjectId", projectId)
      }
    },
    [store],
  )
}
