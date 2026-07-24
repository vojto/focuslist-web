import type { ListId } from "../types"

export const projectRoute = "/projects/:id"

export const rootPath = "/"

export const projectPath = (projectId: ListId) => `/projects/${projectId}`
