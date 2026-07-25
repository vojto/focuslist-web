import { Check } from "lucide-react"
import { useCell, useDb } from "../../store/hooks"
import { setTodoNotes, setTodoTitle } from "../../store/operations/todos"
import { sealUndoStep } from "../../store/operations/undo"
import type { TodoId } from "../../store/schema"
import { closeTodo } from "../../store/ui-store"
import { TODO_PLACEHOLDER_TITLE } from "../../ui/display-name"

// One task, opened in place of the Today pane: its title and its notes, and
// the button that closes it again.
//
// Both fields are driven straight from TinyBase — every keystroke is a real
// write, so nothing lives only in a textarea and a reload cannot lose it.
// What a keystroke does not do is seal an undo step; leaving the field does,
// so a stretch of typing undoes as one edit rather than one character at a
// time. That is the same bargain a drag makes (see operations/undo).
export default function TaskEditorPane({ todoId }: { todoId: TodoId }) {
  const db = useDb()
  const title = useCell("todos", todoId, "title")
  const notes = useCell("todos", todoId, "notes")

  const sealEdit = () => {
    sealUndoStep(db, "Edit task")
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
            onBlur={sealEdit}
            onChange={(event) => {
              setTodoTitle(db, todoId, event.target.value)
            }}
            placeholder={TODO_PLACEHOLDER_TITLE}
            rows={1}
            value={title ?? ""}
          />
          <CloseButton />
        </div>

        <textarea
          aria-label="Notes"
          className="min-h-0 flex-1 resize-none bg-transparent leading-relaxed text-neutral-700 outline-none placeholder:text-neutral-400"
          onBlur={sealEdit}
          onChange={(event) => {
            setTodoNotes(db, todoId, event.target.value)
          }}
          placeholder="Notes"
          value={notes ?? ""}
        />
      </div>

      {/* Empty, but it keeps the column's bottom border in line with the
          footer of the pane beside it. */}
      <footer className="h-12 shrink-0 border-t border-neutral-200" />
    </section>
  )
}

// Closing is all it does: the fields have already written everything they
// changed, so there is nothing here to save.
function CloseButton() {
  return (
    <button
      aria-label="Done"
      className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-500 text-white outline-none transition-colors duration-100 hover:bg-blue-600 active:bg-blue-700"
      onClick={closeTodo}
      type="button"
    >
      <Check aria-hidden="true" className="size-4" strokeWidth={3} />
    </button>
  )
}
