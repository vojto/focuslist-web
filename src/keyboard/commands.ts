import type { Db } from "../store/hooks"
import {
  activePane,
  moveSelection,
  moveSelectionToPane,
  selectedTodo,
} from "../store/operations/selection"
import { createTodoInPane, deleteTodo } from "../store/operations/todos"
import { editTodo } from "../store/ui-store"
import { redo, undo } from "../store/operations/undo"
import type { Pane } from "../store/schema"

export interface CommandContext {
  db: Db
  panes: readonly Pane[]
}

// A command is the unit a keybinding runs: a named action with a title,
// addressed by id. Naming them (rather than putting the behavior in the
// keymap) is what lets the same action be reached later from a menu, a
// command palette, or a remapped key.
//
// Every command here is a sentence or two of glue. The rules they lean on —
// what is selected, where the selection goes next, what one undo step
// contains — belong to src/store/operations, so this table stays readable as
// what it is: the list of things the app can be asked to do.
export interface Command {
  title: string
  run: (context: CommandContext) => void
}

export const COMMANDS = {
  "task.create": {
    title: "New task",
    run: ({ db, panes }) => {
      const pane = activePane(panes)
      if (pane !== undefined) {
        createTodoInPane(db, pane.listId, pane.paneId)
      }
    },
  },
  "task.edit": {
    title: "Edit task",
    run: ({ db }) => {
      const selected = selectedTodo(db)
      if (selected !== undefined) {
        editTodo(selected.todoId, selected.paneId)
      }
    },
  },
  "task.delete": {
    title: "Delete task",
    run: ({ db }) => {
      const selected = selectedTodo(db)
      if (selected !== undefined) {
        deleteTodo(db, selected.todoId)
      }
    },
  },
  "edit.undo": {
    title: "Undo",
    run: ({ db }) => {
      undo(db)
    },
  },
  "edit.redo": {
    title: "Redo",
    run: ({ db }) => {
      redo(db)
    },
  },
  "selection.next": {
    title: "Next task",
    run: ({ db, panes }) => {
      moveSelection(db, panes, 1)
    },
  },
  "selection.previous": {
    title: "Previous task",
    run: ({ db, panes }) => {
      moveSelection(db, panes, -1)
    },
  },
  "selection.paneRight": {
    title: "Task in the pane to the right",
    run: ({ db, panes }) => {
      moveSelectionToPane(db, panes, 1)
    },
  },
  "selection.paneLeft": {
    title: "Task in the pane to the left",
    run: ({ db, panes }) => {
      moveSelectionToPane(db, panes, -1)
    },
  },
} satisfies Record<string, Command>

export type CommandId = keyof typeof COMMANDS
