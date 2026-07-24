import type { Db } from "../store/hooks"
import { createTodoInPane, deleteTodo } from "../store/operations/todos"
import {
  clearTodoSelection,
  editTodo,
  selectTodo,
} from "../store/operations/ui-state"
import { redo, undo } from "../store/operations/undo"
import type { ListId, PaneId, TodoId } from "../store/schema"

// A task pane on screen. Commands take them in left-to-right order, which is
// the only thing that makes "the pane to the right" mean anything.
export interface Pane {
  listId: ListId
  paneId: PaneId
}

export interface CommandContext {
  db: Db
  panes: readonly Pane[]
}

// A command is the unit a keybinding runs: a named action with a title,
// addressed by id. Naming them (rather than putting the behavior in the
// keymap) is what lets the same action be reached later from a menu, a
// command palette, or a remapped key.
export interface Command {
  title: string
  run: (context: CommandContext) => void
}

// Where a todo sits: the row order of the list holding it, and its place in
// that order. The list follows from the todo itself — a row only renders in
// the pane showing its list — so no command has to be told which list it is
// working in.
function locate(db: Db, todoId: TodoId) {
  const listId = db.store.getCell("todos", todoId, "listId")
  if (listId === undefined) {
    return undefined
  }
  const todoIds = db.indexes.getSliceRowIds("todosByList", listId)
  return { index: todoIds.indexOf(todoId), todoIds }
}

// With nothing selected the keyboard enters at the leftmost pane, from the
// end it is heading for: down lands on the first todo, up on the last. An
// empty pane is skipped rather than swallowing the keypress — with no project
// selected, or an empty project, that lands on Today.
function selectEdgeTodo({ db, panes }: CommandContext, offset: number) {
  for (const pane of panes) {
    const todoIds = db.indexes.getSliceRowIds("todosByList", pane.listId)
    const todoId = offset > 0 ? todoIds[0] : todoIds.at(-1)
    if (todoId !== undefined) {
      selectTodo(db, todoId, pane.paneId)
      return
    }
  }
}

// Moves the selection by `offset` rows within its own list. At either end of
// the list it stays put.
function moveSelection(context: CommandContext, offset: number) {
  const { db } = context
  const todoId = db.store.getValue("selectedTodoId")
  if (todoId === undefined) {
    selectEdgeTodo(context, offset)
    return
  }
  const paneId = db.store.getValue("selectedTodoPaneId")
  const location = locate(db, todoId)
  const nextTodoId = location?.todoIds[location.index + offset]
  if (nextTodoId !== undefined && paneId !== undefined) {
    selectTodo(db, nextTodoId, paneId)
  }
}

// Moves the selection one pane sideways, holding its place in the list: the
// same row number, or the last row when the pane it lands in is shorter.
// An empty or missing pane is left alone.
function movePane(context: CommandContext, offset: number) {
  const { db, panes } = context
  const todoId = db.store.getValue("selectedTodoId")
  if (todoId === undefined) {
    selectEdgeTodo(context, 1)
    return
  }
  const paneId = db.store.getValue("selectedTodoPaneId")
  const targetPane =
    panes[panes.findIndex((pane) => pane.paneId === paneId) + offset]
  if (targetPane === undefined) {
    return
  }
  const todoIds = db.indexes.getSliceRowIds("todosByList", targetPane.listId)
  const rowIndex = locate(db, todoId)?.index ?? 0
  const nextTodoId = todoIds[Math.min(rowIndex, todoIds.length - 1)]
  if (nextTodoId !== undefined) {
    selectTodo(db, nextTodoId, targetPane.paneId)
  }
}

// Where the selection should land once a todo is gone: the row that slides
// up into its place, or the one above it when it was last. Without this the
// selection would name a deleted row and every key after it would do nothing.
function successorOf(db: Db, todoId: TodoId): TodoId | undefined {
  const location = locate(db, todoId)
  if (location === undefined) {
    return undefined
  }
  return (
    location.todoIds[location.index + 1] ?? location.todoIds[location.index - 1]
  )
}

// The pane a task command acts on: the one holding the selection, or the
// leftmost pane when nothing is selected — or when the selection sits in a
// pane that is no longer on screen.
function activePane({ db, panes }: CommandContext): Pane | undefined {
  const paneId = db.store.getValue("selectedTodoPaneId")
  return panes.find((pane) => pane.paneId === paneId) ?? panes[0]
}

export const COMMANDS = {
  "task.create": {
    title: "New task",
    run: (context) => {
      const pane = activePane(context)
      if (pane !== undefined) {
        createTodoInPane(context.db, pane.listId, pane.paneId)
      }
    },
  },
  "task.edit": {
    title: "Edit task",
    run: ({ db }) => {
      const todoId = db.store.getValue("selectedTodoId")
      const paneId = db.store.getValue("selectedTodoPaneId")
      if (todoId !== undefined && paneId !== undefined) {
        editTodo(db, todoId, paneId)
      }
    },
  },
  "task.delete": {
    title: "Delete task",
    run: ({ db }) => {
      const todoId = db.store.getValue("selectedTodoId")
      const paneId = db.store.getValue("selectedTodoPaneId")
      if (todoId === undefined || paneId === undefined) {
        return
      }
      const successorId = successorOf(db, todoId)
      deleteTodo(db, todoId)
      // Moving the selection on is deliberately left outside the delete's
      // undo step: undoing restores the row *and* the selection that pointed
      // at it, and this pending change is discarded on the way back.
      if (successorId === undefined) {
        clearTodoSelection(db)
      } else {
        selectTodo(db, successorId, paneId)
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
    run: (context) => {
      moveSelection(context, 1)
    },
  },
  "selection.previous": {
    title: "Previous task",
    run: (context) => {
      moveSelection(context, -1)
    },
  },
  "selection.paneRight": {
    title: "Task in the pane to the right",
    run: (context) => {
      movePane(context, 1)
    },
  },
  "selection.paneLeft": {
    title: "Task in the pane to the left",
    run: (context) => {
      movePane(context, -1)
    },
  },
} satisfies Record<string, Command>

export type CommandId = keyof typeof COMMANDS
