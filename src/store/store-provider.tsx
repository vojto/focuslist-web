import { useState, type ReactNode } from "react"
import { createCheckpoints } from "tinybase/checkpoints/with-schemas"
import { createIndexes } from "tinybase/indexes/with-schemas"
import { createLocalPersister } from "tinybase/persisters/persister-browser/with-schemas"
import {
  Provider,
  useCreateCheckpoints,
  useCreateIndexes,
  useCreatePersister,
  useCreateStore,
} from "./hooks"
import {
  createAppStore,
  INITIAL_CONTENT,
  SESSION_VALUE_IDS,
  STORE_ID,
  TODAY_LIST_ID,
  TODAY_LIST_ROW,
} from "./schema"

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
  const checkpoints = useCreateCheckpoints(store, createCheckpoints)

  useCreatePersister(
    store,
    (persistedStore) => createLocalPersister(persistedStore, STORE_ID),
    [],
    async (persister) => {
      await persister.load(INITIAL_CONTENT)
      // The Today list is a structural invariant, not just first-run seed
      // data — restore it even if persisted data was damaged or predates it.
      if (!persister.getStore().hasRow("lists", TODAY_LIST_ID)) {
        persister.getStore().setRow("lists", TODAY_LIST_ID, TODAY_LIST_ROW)
      }
      // Selection and edit mode are store values so several components can
      // read them, not so they can outlive the session.
      for (const valueId of SESSION_VALUE_IDS) {
        persister.getStore().delValue(valueId)
      }
      await persister.startAutoSave()
      setIsReady(true)
    },
  )

  return (
    <Provider checkpoints={checkpoints} indexes={indexes} store={store}>
      {isReady ? children : null}
    </Provider>
  )
}
