import { arrayMove } from "@dnd-kit/sortable"
import { db, type Project } from "../db"

export function useReorderProjects(projects: readonly Project[] | undefined) {
  return async (activeId: number, overId: number) => {
    if (projects === undefined) {
      return
    }
    const activeIndex = projects.findIndex((project) => project.id === activeId)
    const overIndex = projects.findIndex((project) => project.id === overId)
    if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
      return
    }
    const reordered = arrayMove([...projects], activeIndex, overIndex)
    await db.transaction("rw", db.projects, () =>
      Promise.all(
        reordered.map((project, order) =>
          db.projects.update(project.id, { order }),
        ),
      ),
    )
  }
}
