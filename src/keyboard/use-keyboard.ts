import { useEffect } from "react"
import { useDb } from "../store/hooks"
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

// Whether the focused element already answers to this key itself, in which
// case the shortcut stands down rather than firing a second action alongside
// it. Text entry and an open menu take the whole keyboard — every letter is
// either typing or menu typeahead. A plain control takes only the two keys
// that activate it, so "c" still makes a task while a button has focus but
// Enter does not both press the button and open an editor.
function ownsKey(target: EventTarget | null, key: string): boolean {
  if (isTextEntry(target)) {
    return true
  }
  if (!(target instanceof HTMLElement)) {
    return false
  }
  return target.closest('[role="menu"]') !== null
    ? true
    : (key === "Enter" || key === " ") &&
        target.closest("button, a[href]") !== null
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
  const db = useDb()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (ownsKey(event.target, event.key)) {
        return
      }
      const commandId = KEYMAP[keyStringOf(event)]
      if (commandId === undefined) {
        return
      }
      // Arrow keys would otherwise scroll the pane out from under the
      // selection they just moved.
      event.preventDefault()
      COMMANDS[commandId].run({ db, panes })
      revealSelectedTodo(db.store.getValue("selectedTodoId"))
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [db, panes])
}
