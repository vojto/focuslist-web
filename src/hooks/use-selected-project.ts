import { useLocation, useRoute } from "wouter"
import { projectPath, projectRoute, rootPath } from "../lib/routes"
import type { ListId } from "../store/schema"

export function useSelectedProjectId(): ListId | undefined {
  const [match, params] = useRoute(projectRoute)
  return match ? params.id : undefined
}

export function useSelectProject() {
  const [, navigate] = useLocation()
  return (projectId: ListId | undefined) => {
    navigate(projectId === undefined ? rootPath : projectPath(projectId))
  }
}
