import { useState } from "react"
import { useInitEditInput } from "../../hooks/use-init-edit-input"

// The row's inline title editor. Edit mode is owned by the store, so this
// input mounts exactly when an edit starts — which makes mounting the right
// moment to seed the draft and take focus. It owns the text; the row decides
// what committing means.
export default function TaskTitleInput({
  initialTitle,
  onCancel,
  onCommit,
}: {
  initialTitle: string
  onCancel: () => void
  onCommit: (title: string) => void
}) {
  const [draft, setDraft] = useState(initialTitle)
  const initInput = useInitEditInput()

  return (
    <input
      ref={initInput}
      className="min-w-0 flex-1 select-text bg-transparent p-0 text-neutral-800 outline-none"
      onBlur={() => onCommit(draft)}
      onChange={(event) => setDraft(event.target.value)}
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
