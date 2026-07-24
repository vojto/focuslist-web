import { Dialog } from "@base-ui/react/dialog"
import { useState } from "react"

export default function NewTaskDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (title: string) => void | Promise<void>
}) {
  const [title, setTitle] = useState("")

  return (
    <Dialog.Root
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
      open
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-neutral-900/30" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 w-80 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-xl outline-none">
          <form
            className="flex flex-col gap-4 p-5"
            onSubmit={(event) => {
              event.preventDefault()
              const trimmed = title.trim()
              if (!trimmed) {
                return
              }
              void onCreate(trimmed)
              onClose()
            }}
          >
            <Dialog.Title className="text-sm font-semibold text-neutral-800">
              New task
            </Dialog.Title>
            <input
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Task name"
              type="text"
              value={title}
            />
            <div className="flex justify-end gap-2">
              <Dialog.Close className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800">
                Cancel
              </Dialog.Close>
              <button
                className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-40"
                disabled={!title.trim()}
                type="submit"
              >
                Create
              </button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
