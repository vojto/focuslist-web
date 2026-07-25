import { Check, X } from "lucide-react"
import type { KeyboardEvent } from "react"
import { useCell, useDb } from "../../store/hooks"
import { commitEditor, discardEditor } from "../../store/operations/editor"
import { setTodoNotes, setTodoTitle } from "../../store/operations/todos"
import type { TodoId } from "../../store/schema"
import { TODO_PLACEHOLDER_TITLE } from "../../ui/display-name"
import ToolbarButton from "../../ui/toolbar-button"

// One task, opened in place of the Today pane: its title, its notes, and the
// two ways out — keep what was typed, or throw it away.
//
// The fields are driven straight from TinyBase; every keystroke is a real
// write, so nothing lives only in a textarea and a reload cannot lose it.
// Which is also why there is no saving here: what a stretch of typing adds up
// to — one undo step, or nothing at all — is decided by the editor gesture in
// store/operations/editor.ts.
export default function TaskEditorPane({ todoId }: { todoId: TodoId }) {
  const db = useDb()
  const title = useCell("todos", todoId, "title")
  const notes = useCell("todos", todoId, "notes")

  // Cmd+Enter is the fields' own, not a keybinding: it means "I am done with
  // what I am typing", which says nothing with no field focused. Escape is
  // the app's and works from anywhere, editor or not (see keyboard/keymap).
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && event.metaKey) {
      event.preventDefault()
      commitEditor(db)
    }
  }

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col bg-white">
      {/* px-8 puts the title where a pane's own title sits: the list's px-5
          padding plus the px-3 of the card the rows draw. */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 px-8 py-8">
        <div className="flex items-start gap-3">
          <textarea
            aria-label="Task title"
            className="field-sizing-content min-w-0 flex-1 resize-none bg-transparent text-2xl font-semibold tracking-tight text-neutral-800 outline-none placeholder:text-neutral-400"
            onChange={(event) => {
              setTodoTitle(db, todoId, event.target.value)
            }}
            onKeyDown={handleKeyDown}
            placeholder={TODO_PLACEHOLDER_TITLE}
            rows={1}
            value={title ?? ""}
          />
          <DoneButton
            onClick={() => {
              commitEditor(db)
            }}
          />
        </div>

        <textarea
          aria-label="Notes"
          className="min-h-0 flex-1 resize-none bg-transparent leading-relaxed text-neutral-700 outline-none placeholder:text-neutral-400"
          onChange={(event) => {
            setTodoNotes(db, todoId, event.target.value)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Notes"
          value={notes ?? ""}
        />
      </div>

      {/* Same shape as a list pane's footer, so the two columns keep one
          bottom border between them. */}
      <footer className="h-12 shrink-0 border-t border-neutral-200 p-2">
        <ToolbarButton
          onClick={() => {
            discardEditor(db)
          }}
        >
          <X aria-hidden="true" className="size-4" />
          Cancel
        </ToolbarButton>
      </footer>
    </section>
  )
}

function DoneButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      aria-label="Done"
      className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-500 text-white outline-none transition-colors duration-100 hover:bg-blue-600 active:bg-blue-700"
      onClick={onClick}
      type="button"
    >
      <Check aria-hidden="true" className="size-4" strokeWidth={3} />
    </button>
  )
}
