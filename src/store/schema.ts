import { createStore, type Content } from "tinybase/with-schemas"

// Doubles as the localStorage key.
export const STORE_ID = "focuslist"

export const TODAY_LIST_ID = "today"

// Where each list sits on screen. Today is the one pane that is always
// visible, which makes it where the keyboard enters the app; the project
// pane is there only while a project is selected.
export const PROJECT_PANE_ID = "left"
export const TODAY_PANE_ID = "right"

export type TodoId = string
export type ListId = string
// Identifies a task pane on screen ("left", "right"), not the list it
// shows — two panes may show the same list someday.
export type PaneId = string

// A task pane on screen. Callers pass them in left-to-right order, which is
// the only thing that makes "the pane to the right" mean anything. It is the
// one part of the layout the store cannot answer for itself.
export interface Pane {
  listId: ListId
  paneId: PaneId
}

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

// The document has no values, only tables — selection, edit mode, layout and
// the open project all live in ui-store.ts. Declaring the schema empty is
// what enforces that: TinyBase drops values the schema does not name, so a
// stray write cannot land here, and neither can the values older versions of
// the app persisted. A checkpoint is therefore a document state and nothing
// else, which is what keeps undo from rewinding the way the app looks.
export const VALUES_SCHEMA = {} as const

export type Schemas = [typeof TABLES_SCHEMA, typeof VALUES_SCHEMA]

export const createAppStore = () =>
  createStore().setTablesSchema(TABLES_SCHEMA).setValuesSchema(VALUES_SCHEMA)

// The Today list is a structural invariant: seeded on first run via
// INITIAL_CONTENT and restored on load if missing (see store-provider.tsx).
export const TODAY_LIST_ROW = {
  kind: "today",
  name: "Today",
  position: 0,
} as const

// Used only when nothing has been persisted yet.
export const INITIAL_CONTENT: Content<Schemas, true> = [
  { lists: { [TODAY_LIST_ID]: TODAY_LIST_ROW } },
  {},
]
