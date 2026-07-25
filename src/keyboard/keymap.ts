import type { CommandId } from "./commands"

// Every binding in the app, as data — one table you can read top to bottom,
// and the only place a key is tied to behavior.
export const KEYMAP: Record<string, CommandId> = {
  ArrowDown: "selection.next",
  ArrowUp: "selection.previous",
  ArrowRight: "selection.paneRight",
  ArrowLeft: "selection.paneLeft",
  c: "task.create",
  "Shift+c": "section.create",
  Enter: "task.edit",
  Backspace: "task.delete",
  Delete: "task.delete",
  Escape: "editor.discard",
  "Meta+z": "edit.undo",
  "Meta+Shift+z": "edit.redo",
}

// Serializes an event into the keymap's key format: modifiers in a fixed
// order, then `KeyboardEvent.key` — "ArrowDown", "Meta+ArrowDown". Spelling
// out the modifiers is what keeps a plain binding from also firing for the
// modified chord, which would swallow the system shortcut.
//
// A printable key is lowercased first, because `key` carries the shifted
// character: Shift+Z arrives as "Z" and caps lock alone turns "c" into "C".
// The modifier list already says whether Shift was down, so the case of the
// character would only be a second, less reliable way to ask.
export function keyStringOf(event: KeyboardEvent): string {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
  const modifiers: string[] = []
  if (event.metaKey) {
    modifiers.push("Meta")
  }
  if (event.ctrlKey) {
    modifiers.push("Ctrl")
  }
  if (event.altKey) {
    modifiers.push("Alt")
  }
  if (event.shiftKey) {
    modifiers.push("Shift")
  }
  return [...modifiers, key].join("+")
}
