import { useCallback, useState } from "react"

// Inline-rename state shared by rows that edit their name in place: a draft
// that starts from the current name, and commit-on-blur/Enter semantics
// (trimmed, non-empty, and actually changed — otherwise the edit is a no-op).
export function useInlineRename(
  currentName: string | undefined,
  onRename: (name: string) => void,
) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState("")

  const startEditing = () => {
    setDraft(currentName ?? "")
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setIsEditing(false)
  }

  const commitEdit = () => {
    setIsEditing(false)
    const trimmed = draft.trim()
    if (trimmed !== "" && trimmed !== currentName) {
      onRename(trimmed)
    }
  }

  // Stable identity so the ref only runs when the input mounts, not on every
  // keystroke re-render.
  const initInput = useCallback((node: HTMLInputElement | null) => {
    if (node !== null) {
      node.focus()
      node.setSelectionRange(node.value.length, node.value.length)
    }
  }, [])

  return {
    cancelEdit,
    commitEdit,
    draft,
    initInput,
    isEditing,
    setDraft,
    startEditing,
  }
}
