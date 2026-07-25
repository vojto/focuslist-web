import { Dialog } from "@base-ui/react/dialog"
import { Radio } from "@base-ui/react/radio"
import { RadioGroup } from "@base-ui/react/radio-group"
import { X } from "lucide-react"
import { useCell, useDb } from "../../store/hooks"
import { setProjectIcon } from "../../store/operations/lists"
import type { ListId } from "../../store/schema"
import { DEFAULT_PROJECT_ICON, PROJECT_ICONS } from "../../ui/project-icons"

// Picking an icon is the whole dialog, so a pick commits it and closes —
// there is nothing left for an OK button to confirm. A radio group rather
// than a grid of buttons because the tiles are one exclusive choice: it
// arrows between them and reads the current one as selected.
export default function ProjectIconDialog({
  isOpen,
  onOpenChange,
  projectId,
}: {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  projectId: ListId
}) {
  const db = useDb()
  const iconName = useCell("lists", projectId, "icon")

  const handlePick = (nextIconName: string) => {
    setProjectIcon(db, projectId, nextIconName)
    onOpenChange(false)
  }

  return (
    <Dialog.Root onOpenChange={onOpenChange} open={isOpen}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/20 transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 w-80 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-neutral-200 bg-white p-4 shadow-xl outline-none transition-[opacity,scale] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <div className="mb-3 flex items-center justify-between">
            <Dialog.Title className="text-sm font-semibold text-neutral-900">
              Project Icon
            </Dialog.Title>
            <Dialog.Close
              aria-label="Close"
              className="-mr-1 rounded-md p-1 text-neutral-400 outline-none transition-colors hover:bg-neutral-100 hover:text-neutral-600 focus-visible:ring-2 focus-visible:ring-neutral-400"
            >
              <X aria-hidden="true" className="size-4" />
            </Dialog.Close>
          </div>

          <RadioGroup
            aria-label="Project icon"
            className="grid grid-cols-6 gap-1.5"
            onValueChange={handlePick}
            value={iconName ?? DEFAULT_PROJECT_ICON}
          >
            {Object.entries(PROJECT_ICONS).map(([name, { Icon, label }]) => (
              <Radio.Root
                aria-label={label}
                className="flex size-10 items-center justify-center rounded-lg text-neutral-600 outline-none transition-colors hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-neutral-400 data-[checked]:bg-neutral-900 data-[checked]:text-white"
                key={name}
                value={name}
              >
                <Icon aria-hidden="true" className="size-5" />
              </Radio.Root>
            ))}
          </RadioGroup>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
