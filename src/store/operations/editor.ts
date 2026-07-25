import type { Db } from "../hooks"
import type { TodoId } from "../schema"
import { closeTodo, openTodo, uiState } from "../ui-store"
import { currentCheckpoint, revertTo, sealUndoStep } from "./undo"

// The task editor, as a gesture. Its fields write to the document on every
// keystroke — nothing is ever held only in a textarea — so what a stretch of
// typing adds up to is decided here rather than by the fields: opening
// remembers where the document stood, and closing either seals everything
// since as one undo step or puts the document back. That is the same bargain
// a drag makes (see ./undo), and it is why the fields themselves have no
// notion of saving.
//
// ui-store.ts holds the two values; this module owns what they mean, so a
// keybinding, the Done button and a future menu item all get one answer.

export function openEditor(db: Db, todoId: TodoId) {
  // Opening one task ends the session at any other: what was typed there
  // keeps its own step, and this editor gets a sealed point to return to.
  // With nothing open that is a no-op, and the checkpoint is simply read —
  // opening changes nothing, and a step sealed here would undo nothing.
  commitEditor(db)
  openTodo(todoId, currentCheckpoint(db))
}

// Keeps what was typed, as one step for the whole session at the editor.
export function commitEditor(db: Db) {
  if (uiState().openTodoId === undefined) {
    return
  }
  sealUndoStep(db, "Edit task")
  closeTodo()
}

// Throws it away. With no editor open there is nothing to dismiss, which is
// what makes Escape harmless everywhere else in the app.
export function discardEditor(db: Db) {
  const { openTodoId, openTodoCheckpointId } = uiState()
  if (openTodoId === undefined) {
    return
  }
  if (openTodoCheckpointId !== undefined) {
    revertTo(db, openTodoCheckpointId)
  }
  closeTodo()
}
