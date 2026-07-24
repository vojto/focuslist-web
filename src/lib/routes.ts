import type { ListId } from "../store/schema"

export const projectRoute = "/projects/:id"

export const rootPath = "/"

export const projectPath = (projectId: ListId) => `/projects/${projectId}`
