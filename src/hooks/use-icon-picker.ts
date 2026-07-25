import { useHasRow } from "../store/hooks"
import type { ListId } from "../store/schema"
import { useUiStore } from "../store/ui-store"

// The project the icon picker is open for, resolved against the document the
// way the open task is: an id naming a deleted project is no open picker, so
// deleting a project closes it with nothing left to clean up.
export function useIconPickerProjectId(): ListId | undefined {
  const projectId = useUiStore((ui) => ui.iconPickerProjectId)
  const isOpen = useHasRow("lists", projectId ?? "")
  return isOpen ? projectId : undefined
}
