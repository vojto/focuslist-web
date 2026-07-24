import { useEffect } from "react"
import { useIndexes, useStore } from "../store/hooks"
import { COMMANDS, type Pane } from "./commands"
import { KEYMAP, keyStringOf } from "./keymap"

// Text entry owns its keys — an inline rename needs its own arrows and its
// own Escape, so shortcuts stand down while one is focused.
function isTextEntry(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  )
}

// Scrolls whatever a command just selected far enough to be visible. This
// belongs to the keyboard and nowhere else: a pointer selects on pointerdown,
// which is also drag start, and scrolling a list out from under a drag throws
// off every viewport rectangle the drag and the FLIP animation measure.
function revealSelectedTodo(todoId: string | undefined) {
  if (todoId !== undefined) {
    document
      .querySelector(`[data-flip-id="${todoId}"]`)
      ?.scrollIntoView({ block: "nearest" })
  }
}

// The app's one keydown listener. It lives on the window rather than on the
// rows so a shortcut works wherever focus happens to be, and it does nothing
// itself beyond looking the event up in the keymap and running the command
// it names. `panes` is the screen's task panes in left-to-right order — the
// one thing about the layout that commands cannot read out of the store.
export function useKeyboard(panes: readonly Pane[]) {
  const store = useStore()
  const indexes = useIndexes()

  useEffect(() => {
    if (store === undefined || indexes === undefined) {
      return
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTextEntry(event.target)) {
        return
      }
      const commandId = KEYMAP[keyStringOf(event)]
      if (commandId === undefined) {
        return
      }
      // Arrow keys would otherwise scroll the pane out from under the
      // selection they just moved.
      event.preventDefault()
      COMMANDS[commandId].run({ db: { store, indexes }, panes })
      revealSelectedTodo(store.getValue("selectedTodoId"))
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [indexes, panes, store])
}
