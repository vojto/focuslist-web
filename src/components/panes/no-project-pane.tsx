import ToolbarButton from "../../ui/toolbar-button"

// Stands in for the project pane while no project is selected. It keeps the
// footer so the column's height and border line up with the pane beside it.
export default function NoProjectPane() {
  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col bg-neutral-50">
      <div className="grid min-h-0 flex-1 place-items-center">
        <p className="text-sm text-neutral-400">No project selected</p>
      </div>
      <footer className="h-12 shrink-0 border-t border-neutral-200 bg-white p-2">
        <ToolbarButton disabled>
          <span aria-hidden="true">＋</span>
          New task
        </ToolbarButton>
      </footer>
    </section>
  )
}
