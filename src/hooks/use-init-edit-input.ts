import { useCallback } from "react"

// Ref callback for an inline edit input: focuses it and puts the caret at
// the end of the text when it mounts. The identity must be stable so the
// ref only runs on mount, not on every keystroke re-render — this is the
// one place a useCallback earns its keep under the React Compiler.
export function useInitEditInput() {
  return useCallback((node: HTMLInputElement | null) => {
    if (node !== null) {
      node.focus()
      node.setSelectionRange(node.value.length, node.value.length)
    }
  }, [])
}
