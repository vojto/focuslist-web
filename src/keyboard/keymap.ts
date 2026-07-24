import type { CommandId } from "./commands"

// Every binding in the app, as data — one table you can read top to bottom,
// and the only place a key is tied to behavior.
export const KEYMAP: Record<string, CommandId> = {
  ArrowDown: "selection.next",
  ArrowUp: "selection.previous",
  ArrowRight: "selection.paneRight",
  ArrowLeft: "selection.paneLeft",
}

// Serializes an event into the keymap's key format: modifiers in a fixed
// order, then `KeyboardEvent.key` — "ArrowDown", "Meta+ArrowDown". Spelling
// out the modifiers is what keeps a plain binding from also firing for the
// modified chord, which would swallow the system shortcut.
export function keyStringOf(event: KeyboardEvent): string {
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
  return [...modifiers, event.key].join("+")
}
