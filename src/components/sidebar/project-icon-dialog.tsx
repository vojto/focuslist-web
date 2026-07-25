import { Dialog } from "@base-ui/react/dialog"
import { Toggle } from "@base-ui/react/toggle"
import { ToggleGroup } from "@base-ui/react/toggle-group"
import { X } from "lucide-react"
import { useIconPickerProjectId } from "../../hooks/use-icon-picker"
import { useCell, useDb } from "../../store/hooks"
import { setProjectIcon } from "../../store/operations/lists"
import { openIconPicker } from "../../store/ui-store"
import { PROJECT_ICONS, projectIconName } from "../../ui/project-icons"

// One picker for the whole app, mounted by the project list and pointed at a
// project by the store — which is also what says it is open. Picking an icon
// is the whole dialog, so a pick commits it and closes: there is nothing left
// for an OK button to confirm.
//
// A toggle group rather than a radio group, whose arrow keys select as they
// move — which here would commit and close on the first keypress. These arrow
// between the tiles and leave choosing to Enter or a click.
export default function ProjectIconDialog() {
  const db = useDb()
  const projectId = useIconPickerProjectId()
  const iconName = useCell("lists", projectId ?? "", "icon")

  const handlePick = (pressed: string[]) => {
    const nextIconName = pressed.at(0)
    // Pressing the current tile again unpresses it, which is not a choice.
    if (projectId === undefined || nextIconName === undefined) {
      return
    }
    setProjectIcon(db, projectId, nextIconName)
    openIconPicker(undefined)
  }

  return (
    <Dialog.Root
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          openIconPicker(undefined)
        }
      }}
      open={projectId !== undefined}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/20 transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 w-80 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-neutral-200 bg-white p-4 shadow-xl outline-none transition-[opacity,scale] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <div className="mb-3 flex items-center justify-between">
            <Dialog.Title className="text-sm font-semibold text-neutral-900">
              Project Icon
            </Dialog.Title>
            <Dialog.Close
              aria-label="Close"
              className="-mr-1 rounded-md p-1 text-neutral-400 outline-none transition-colors hover:bg-neutral-100 hover:text-neutral-600 focus-visible:bg-neutral-100 focus-visible:text-neutral-600"
            >
              <X aria-hidden="true" className="size-4" />
            </Dialog.Close>
          </div>

          {/* No focus rings here either (see index.css) — the tile the
              keyboard is on takes the same grey a hovered one does. */}
          <ToggleGroup
            aria-label="Project icon"
            className="grid grid-cols-6 gap-1.5"
            onValueChange={handlePick}
            value={[projectIconName(iconName)]}
          >
            {Object.entries(PROJECT_ICONS).map(([name, { Icon, label }]) => (
              <Toggle
                aria-label={label}
                className="flex size-10 items-center justify-center rounded-lg text-neutral-600 outline-none transition-colors hover:bg-neutral-100 focus-visible:bg-neutral-100 data-[pressed]:bg-neutral-900 data-[pressed]:text-white"
                key={name}
                value={name}
              >
                <Icon aria-hidden="true" className="size-5" />
              </Toggle>
            ))}
          </ToggleGroup>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
