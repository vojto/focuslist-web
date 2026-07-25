import { useHasRow } from "../store/hooks"
import type { TodoId } from "../store/schema"
import { useUiStore } from "../store/ui-store"

// The open task, resolved against the document, the way the selection and
// edit pairs are: an id naming a deleted row is no open task, so deleting the
// task the editor is showing brings the Today pane back on its own and leaves
// nothing to clean up.
export function useOpenTodoId(): TodoId | undefined {
  const openTodoId = useUiStore((ui) => ui.openTodoId)
  const isOpen = useHasRow("todos", openTodoId ?? "")
  return isOpen ? openTodoId : undefined
}
