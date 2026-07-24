import type { Db } from "../hooks"

// Undo is TinyBase checkpoints. The store keeps the states the user can
// travel between, and one undo step is the difference between two of them —
// so a step is defined by *when the app seals one*, not by how many cells a
// mutation touched.
//
// The rule this module exists to enforce: every user action seals exactly one
// step. Changes that are never sealed stay pending, and pending changes are
// swept into whichever step is sealed next — leave one mutation unsealed and
// an unrelated undo silently reverts it too. Checkpoints cover values as well
// as tables, so a selection move is a pending change like any other.
//
// Two kinds of function therefore live in ./todos and ./lists: actions, which
// wrap themselves in asUndoStep, and building blocks (addTodo, moveTodo,
// reorderProjects), which do not because a drag calls them dozens of times
// and seals the whole gesture itself.

export function asUndoStep(db: Db, label: string, mutate: () => void) {
  // The leading checkpoint seals whatever was still pending so it cannot ride
  // along with this step. It is free when nothing is pending: TinyBase
  // ignores addCheckpoint when the store has not changed.
  db.checkpoints.addCheckpoint()
  db.store.transaction(mutate)
  db.checkpoints.addCheckpoint(label)
}

// Deliberately no leading addCheckpoint: pending changes are the session
// state that piled up after the last action (a selection moved with the
// arrow keys), and stepping back past them is what makes undo land on the
// last thing the user actually did.
export function undo(db: Db) {
  db.checkpoints.goBackward()
}

export function redo(db: Db) {
  db.checkpoints.goForward()
}
