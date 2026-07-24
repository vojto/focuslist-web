import type { Db } from "../store/hooks"

// A command is the unit a keybinding runs: a named action with a title,
// addressed by id. Naming them (rather than putting the behavior in the
// keymap) is what lets the same action be reached later from a menu, a
// command palette, or a remapped key.
export interface Command {
  title: string
  run: (db: Db) => void
}

// Moves the app-wide selection by `offset` rows. The pane never changes:
// the selected todo's own list is the one on screen in the pane holding the
// selection, so the list to walk follows from the todo itself.
function moveSelection(db: Db, offset: number) {
  const todoId = db.store.getValue("selectedTodoId")
  if (todoId === undefined) {
    return
  }
  const listId = db.store.getCell("todos", todoId, "listId")
  if (listId === undefined) {
    return
  }
  const todoIds = db.indexes.getSliceRowIds("todosByList", listId)
  const nextTodoId = todoIds[todoIds.indexOf(todoId) + offset]
  // At either end of the list the selection stays put.
  if (nextTodoId !== undefined) {
    db.store.setValue("selectedTodoId", nextTodoId)
  }
}

export const COMMANDS = {
  "selection.next": {
    title: "Next task",
    run: (db) => {
      moveSelection(db, 1)
    },
  },
  "selection.previous": {
    title: "Previous task",
    run: (db) => {
      moveSelection(db, -1)
    },
  },
} satisfies Record<string, Command>

export type CommandId = keyof typeof COMMANDS
