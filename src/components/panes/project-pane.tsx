import { useLiveQuery } from "dexie-react-hooks"
import { db } from "../../db"
import { useUiStore } from "../../stores/ui-store"

export default function ProjectPane() {
  const selectedProjectId = useUiStore((state) => state.selectedProjectId)
  const project = useLiveQuery(
    () =>
      selectedProjectId === undefined
        ? undefined
        : db.projects.get(selectedProjectId),
    [selectedProjectId],
  )

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col bg-neutral-50">
      {project ? (
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-2xl">
            <header className="mb-8">
              <h1 className="text-2xl font-semibold tracking-tight">
                {project.name}
              </h1>
            </header>

            <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-400">
              No tasks in this project yet.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid flex-1 place-items-center overflow-y-auto p-8">
          <div className="text-center">
            <p className="text-sm font-medium text-neutral-500">
              No project selected
            </p>
            <p className="mt-1 text-sm text-neutral-400">
              Choose a project from the sidebar.
            </p>
          </div>
        </div>
      )}

      <footer
        aria-hidden="true"
        className="h-12 shrink-0 border-t border-neutral-200 bg-neutral-50"
      />
    </section>
  )
}
