import { createStore, type Content } from "tinybase/with-schemas"

// Doubles as the localStorage key.
export const STORE_ID = "focuslist"

export const TODAY_LIST_ID = "today"

export type TodoId = string
export type ListId = string
// Identifies a task pane on screen ("left", "right"), not the list it
// shows — two panes may show the same list someday.
export type PaneId = string

// Two tables, SQL-style. A todo *shows* in exactly one list (`listId`,
// ordered by fractional `position` within it) but *belongs* to a project
// (`projectId`), which scheduling onto Today never touches.
export const TABLES_SCHEMA = {
  lists: {
    kind: { type: "string" }, // "today" | "project"
    name: { type: "string" },
    position: { type: "number" },
  },
  todos: {
    title: { type: "string" },
    isCompleted: { type: "boolean", default: false },
    listId: { type: "string" },
    position: { type: "number" },
    projectId: { type: "string" },
  },
} as const

export const VALUES_SCHEMA = {
  sidebarWidth: { type: "number", default: 224 },
  projectWidth: { type: "number" },
  // App-wide single selection: the todo plus the pane it was selected in.
  // One value pair means two panes can never both hold a selection.
  selectedTodoId: { type: "string" },
  selectedTodoPaneId: { type: "string" },
} as const

export type Schemas = [typeof TABLES_SCHEMA, typeof VALUES_SCHEMA]

export const createAppStore = () =>
  createStore().setTablesSchema(TABLES_SCHEMA).setValuesSchema(VALUES_SCHEMA)

// Used only when nothing has been persisted yet.
export const INITIAL_CONTENT: Content<Schemas, true> = [
  {
    lists: {
      [TODAY_LIST_ID]: { kind: "today", name: "Today", position: 0 },
    },
  },
  {},
]
