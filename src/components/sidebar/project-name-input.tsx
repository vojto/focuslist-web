import { useState } from "react"
import { useInitEditInput } from "../../hooks/use-init-edit-input"

// The sidebar's inline name editor, the project counterpart to the task
// list's TaskTitleInput. Edit mode is owned by the store, so this input
// mounts exactly when an edit starts — which makes mounting the right moment
// to seed the draft and take focus. It owns the text; the row decides what
// committing means.
export default function ProjectNameInput({
  initialName,
  onCancel,
  onCommit,
}: {
  initialName: string
  onCancel: () => void
  onCommit: (name: string) => void
}) {
  const [draft, setDraft] = useState(initialName)
  const initInput = useInitEditInput()

  return (
    <input
      ref={initInput}
      className="min-w-0 flex-1 bg-transparent p-0 outline-none"
      onBlur={() => {
        onCommit(draft)
      }}
      onChange={(event) => {
        setDraft(event.target.value)
      }}
      // The row is a sortable, and its keyboard plugin would read these keys
      // as drag input.
      onKeyDown={(event) => {
        event.stopPropagation()
        if (event.key === "Enter") {
          onCommit(draft)
        } else if (event.key === "Escape") {
          onCancel()
        }
      }}
      value={draft}
    />
  )
}
