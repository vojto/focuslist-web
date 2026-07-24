import type { Db } from "../hooks"

// Undo is TinyBase checkpoints. Apart from store-provider.tsx, which creates
// them, this module is the only place that touches them: a step is defined
// by when the app seals one, so scattering addCheckpoint calls through the
// app would be scattering the definition of an undo step.
//
// Two rules make undo mean "the last thing I did to my tasks".
//
// 1. Undo moves data, never the session. Checkpoints cover values as well as
//    tables, so a bare goBackward would also rewind the selection, the pane
//    widths, and — the giveaway — put a row you just finished renaming back
//    into edit mode. Values in this app are session and layout state: what
//    the app looks like now, not part of the document's history. So they are
//    snapshotted and put back around every move.
//
// 2. Every sealed step contains a real data change. Sealing on the way *into*
//    an action would otherwise bank the selection move that preceded it as a
//    step of its own — and since undo restores values, that step now reverts
//    nothing, so it reads to the user as a keypress that did nothing.
//    Everything below therefore seals only after changing data, and the
//    building blocks a drag calls dozens of times (addTodo, moveTodo,
//    reorderProjects) leave the sealing to the gesture.

// Runs a checkpoint move with the store's values held still, so only tabular
// data travels.
function preservingValues(db: Db, move: () => void) {
  const values = db.store.getValues()
  move()
  db.store.setValues(values)
}

export function asUndoStep(db: Db, label: string, mutate: () => void) {
  db.store.transaction(mutate)
  db.checkpoints.addCheckpoint(label)
}

// For a gesture that commits as it goes: the drag makes its own changes and
// seals them as one step when it lands. TinyBase ignores this when nothing
// changed, so an empty drag adds nothing to undo.
export function sealUndoStep(db: Db, label: string) {
  db.checkpoints.addCheckpoint(label)
}

// Where a gesture should return to if it is abandoned — read at drag start,
// passed to revertTo on cancel.
export function currentCheckpoint(db: Db): string | undefined {
  return db.checkpoints.getCheckpointIds()[1]
}

// Throws away the changes a gesture made rather than recording them: goTo
// seals the abandoned changes into a forward (redo) checkpoint, so clearing
// forward is what keeps redo from re-applying a canceled drag.
export function revertTo(db: Db, checkpointId: string) {
  preservingValues(db, () => {
    db.checkpoints.goTo(checkpointId)
    db.checkpoints.clearForward()
  })
}

export function undo(db: Db) {
  preservingValues(db, () => {
    db.checkpoints.goBackward()
  })
}

export function redo(db: Db) {
  preservingValues(db, () => {
    db.checkpoints.goForward()
  })
}
