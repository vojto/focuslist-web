import { useLiveQuery } from "dexie-react-hooks"
import { db } from "../db"

export function useProjects() {
  return useLiveQuery(() => db.projects.orderBy("order").toArray(), [])
}

export function useProject(projectId: number | undefined) {
  return useLiveQuery(
    () => (projectId === undefined ? undefined : db.projects.get(projectId)),
    [projectId],
  )
}

export async function createProject(name: string) {
  const lastProject = await db.projects.orderBy("order").last()
  return db.projects.add({ name, order: (lastProject?.order ?? -1) + 1 })
}

export async function reorderProjects(orderedIds: readonly number[]) {
  await db.transaction("rw", db.projects, () =>
    Promise.all(
      orderedIds.map((projectId, order) =>
        db.projects.update(projectId, { order }),
      ),
    ),
  )
}
