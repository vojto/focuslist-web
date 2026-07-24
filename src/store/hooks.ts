import * as UiReactModule from "tinybase/ui-react/with-schemas"
import type { Indexes } from "tinybase/indexes/with-schemas"
import type { Store } from "tinybase/with-schemas"
import type { Schemas } from "./schema"

// The single schema-typed cast (the documented TinyBase pattern); everything
// else in the app imports its hooks from here.
const UiReact = UiReactModule as unknown as UiReactModule.WithSchemas<Schemas>

// Readers, plus the setup hooks the provider needs. TinyBase's row/cell
// writing hooks are deliberately not re-exported: every table mutation goes
// through src/store/operations, so components have no way to reach for one.
export const {
  Provider,
  useCell,
  useCheckpoints,
  useCreateCheckpoints,
  useCreateIndexes,
  useCreatePersister,
  useCreateStore,
  useIndexes,
  useSetValueCallback,
  useSliceRowIds,
  useStore,
  useValue,
} = UiReact

// The store and its indexes, bundled like a database connection for the
// operations in ./operations.ts.
export interface Db {
  store: Store<Schemas>
  indexes: Indexes<Schemas>
}

export function useDb(): Db {
  const store = useStore()
  const indexes = useIndexes()
  if (store === undefined || indexes === undefined) {
    throw new Error("useDb must be used inside StoreProvider")
  }
  return { store, indexes }
}
