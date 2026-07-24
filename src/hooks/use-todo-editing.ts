import { useEffect } from "react"
import { useDb, useValue } from "../store/hooks"
import type { PaneId } from "../store/schema"

export function useIsPaneEditing(paneId: PaneId): boolean {
  return useValue("editingTodoPaneId") === paneId
}

// Mirrors a row's local edit state into the store so the owning pane can
// react to it. The effect cleanup also clears the value if the row unmounts
// mid-edit (e.g. the todo is deleted).
export function useBroadcastTodoEditing(paneId: PaneId, isEditing: boolean) {
  const { store } = useDb()
  useEffect(() => {
    if (!isEditing) {
      return
    }
    store.setValue("editingTodoPaneId", paneId)
    return () => {
      store.delValue("editingTodoPaneId")
    }
  }, [isEditing, paneId, store])
}
