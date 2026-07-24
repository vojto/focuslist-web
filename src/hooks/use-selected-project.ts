import type { ListId } from "../store/schema"
import { useUiStore } from "../store/ui-store"

export function useSelectedProjectId(): ListId | undefined {
  return useUiStore((ui) => ui.selectedProjectId)
}
