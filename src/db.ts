import { createIndexes } from "tinybase/indexes/with-schemas"
import { createLocalPersister } from "tinybase/persisters/persister-browser/with-schemas"
import * as UiReactModule from "tinybase/ui-react/with-schemas"
import { createStore, type NoValuesSchema } from "tinybase/with-schemas"

export const TODAY_LIST_ID = "today"

// Two tables, SQL-style. A todo *shows* in exactly one list (`listId`,
// ordered by `position` within it) but *belongs* to a project (`projectId`),
// which scheduling onto Today never touches.
const TABLES_SCHEMA = {
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

type Schemas = [typeof TABLES_SCHEMA, NoValuesSchema]

export const db = createStore().setTablesSchema(TABLES_SCHEMA)

export const indexes = createIndexes(db)
indexes.setIndexDefinition("todosByList", "todos", "listId", "position")
indexes.setIndexDefinition("listsByKind", "lists", "kind", "position")

const persister = createLocalPersister(db, "focuslist")
await persister.startAutoLoad()
void persister.startAutoSave()

if (!db.hasRow("lists", TODAY_LIST_ID)) {
  db.setRow("lists", TODAY_LIST_ID, {
    kind: "today",
    name: "Today",
    position: 0,
  })
}

// Schema-typed React hooks (the documented TinyBase cast).
const UiReact = UiReactModule as unknown as UiReactModule.WithSchemas<Schemas>

export const { Provider, useCell, useRow, useSliceRowIds } = UiReact
