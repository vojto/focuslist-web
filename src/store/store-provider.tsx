import { useState, type ReactNode } from "react"
import { createIndexes } from "tinybase/indexes/with-schemas"
import { createLocalPersister } from "tinybase/persisters/persister-browser/with-schemas"
import {
  Provider,
  useCreateIndexes,
  useCreatePersister,
  useCreateStore,
} from "./hooks"
import { createAppStore, INITIAL_CONTENT, STORE_ID } from "./schema"

// Creates the store, its indexes, and persistence, and provides them to the
// app. Children render only once persisted data has loaded — loading must
// finish before auto-save starts so in-memory defaults never overwrite
// persisted data.
export default function StoreProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false)
  const store = useCreateStore(createAppStore)
  const indexes = useCreateIndexes(store, (indexedStore) =>
    createIndexes(indexedStore)
      .setIndexDefinition("todosByList", "todos", "listId", "position")
      .setIndexDefinition("listsByKind", "lists", "kind", "position"),
  )

  useCreatePersister(
    store,
    (persistedStore) => createLocalPersister(persistedStore, STORE_ID),
    [],
    async (persister) => {
      await persister.load(INITIAL_CONTENT)
      await persister.startAutoSave()
      setIsReady(true)
    },
  )

  return (
    <Provider indexes={indexes} store={store}>
      {isReady ? children : null}
    </Provider>
  )
}
