import type { Db } from "../store/hooks"
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

function selectTodo(db: Db, todoId: TodoId, paneId: PaneId) {
  db.store.transaction(() => {
    db.store.setValue("selectedTodoId", todoId)
    db.store.setValue("selectedTodoPaneId", paneId)
  })
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
  const location = locate(db, todoId)
  const nextTodoId = location?.todoIds[location.index + offset]
  if (nextTodoId !== undefined) {
    db.store.setValue("selectedTodoId", nextTodoId)
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

export const COMMANDS = {
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
