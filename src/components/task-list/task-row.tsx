import type { ReactNode } from "react"
import { Feedback } from "@dnd-kit/dom"
import { SortableKeyboardPlugin } from "@dnd-kit/dom/sortable"
import { useSortable } from "@dnd-kit/react/sortable"
import { useInlineRename } from "../../hooks/use-inline-rename"
import { useBroadcastTodoEditing } from "../../hooks/use-todo-editing"
import {
  useIsTodoSelected,
  useSelectTodo,
} from "../../hooks/use-todo-selection"
import {
  useCell,
  useDb,
  useDelRowCallback,
  useSetCellCallback,
} from "../../store/hooks"
import { renameTodo } from "../../store/operations/todos"
import type { ListId, PaneId, TodoId } from "../../store/schema"
import { ContextMenu, ContextMenuItem } from "../../ui/context-menu"

function useTodoCompletion(todoId: TodoId) {
  const isCompleted = useCell("todos", todoId, "isCompleted") === true
  const toggleTodo = useSetCellCallback(
    "todos",
    todoId,
    "isCompleted",
    () => (wasCompleted) => !wasCompleted,
    [],
  )
  return { isCompleted, toggleTodo }
}

// The row's visual card. It reads by id, so every rendering stays in sync.
// Children replace the title label (the edit input slots in here) so the
// row keeps identical dimensions in both modes.
export function TaskRowCard({
  children,
  isEditing = false,
  isSelected = false,
  // showProject is temporarily unused while the project badge is commented
  // out below.
  todoId,
}: {
  children?: ReactNode
  isEditing?: boolean
  isSelected?: boolean
  showProject?: boolean
  todoId: TodoId
}) {
  const title = useCell("todos", todoId, "title")
  const { isCompleted, toggleTodo } = useTodoCompletion(todoId)
  // const projectId = useCell("todos", todoId, "projectId")
  // const projectName = useCell("lists", projectId ?? "", "name")

  if (title === undefined) {
    return null
  }

  // The transition class rides along only in the editing state, so entering
  // edit mode animates but selection changes snap. It's scoped to
  // color/shadow — transitioning transform would fight the FLIP reorder
  // animation.
  const cardClass = isEditing
    ? "bg-white shadow-md transition-[background-color,box-shadow] duration-100"
    : isSelected
      ? "bg-indigo-50"
      : ""

  return (
    <div
      className={`flex cursor-default select-none items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${cardClass}`}
    >
      <input
        aria-label={`Mark ${title} complete`}
        checked={isCompleted}
        className="size-4 shrink-0 appearance-none rounded border border-neutral-300 bg-white bg-cover bg-center bg-no-repeat transition-colors duration-100 checked:border-blue-500 checked:bg-blue-500 checked:bg-checkmark"
        onChange={toggleTodo}
        type="checkbox"
      />
      {children ?? (
        <span
          className={`flex-1 ${
            isCompleted ? "text-neutral-400 line-through" : "text-neutral-800"
          }`}
        >
          {title}
          {/* {showProject && projectName !== undefined && (
            <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-medium text-neutral-500">
              {projectName}
            </span>
          )} */}
        </span>
      )}
    </div>
  )
}

export default function TaskRow({
  index,
  listId,
  paneId,
  showProject = false,
  todoId,
}: {
  index: number
  listId: ListId
  paneId: PaneId
  showProject?: boolean
  todoId: TodoId
}) {
  const db = useDb()
  const isSelected = useIsTodoSelected(paneId, todoId)
  const selectTodo = useSelectTodo(paneId)
  const title = useCell("todos", todoId, "title")
  const {
    cancelEdit,
    commitEdit,
    draft,
    initInput,
    isEditing,
    setDraft,
    startEditing,
  } = useInlineRename(title, (name) => renameTodo(db, todoId, name))
  useBroadcastTodoEditing(paneId, isEditing)
  // While dragging, the library floats the real row (data-dnd-dragging) and
  // keeps a cloned stand-in in the list flow (data-dnd-placeholder); the
  // data variants below style those two states. Every placement change
  // commits the real order, so the stand-in is always the true drop position.
  const { ref } = useSortable({
    id: todoId,
    index,
    group: listId,
    type: "item",
    accept: "item",
    // The library's index transition animates on its own render clock, one
    // frame behind our TinyBase-driven re-renders (visible flicker when
    // rows cross); useFlipList animates reorders pre-paint instead. NOT
    // null — the React wrapper spreads input.transition over the defaults,
    // so null is silently ignored; duration 0 survives the merge.
    transition: { duration: 0 },
    // 0.5.0 has no top-level `feedback` input; it is per-entity plugin
    // config (the SortableInput docs show exactly this pattern). The
    // OptimisticSortingPlugin default is deliberately left out: we commit
    // the real order on every hover, so its speculative reorder would
    // fight the React re-render (double movement = crossing flicker).
    plugins: [
      SortableKeyboardPlugin,
      Feedback.configure({ feedback: "clone" }),
    ],
  })
  const deleteTodo = useDelRowCallback("todos", todoId)
  const { isCompleted, toggleTodo } = useTodoCompletion(todoId)

  return (
    <ContextMenu
      trigger={
        <li
          ref={ref}
          className="touch-none data-[dnd-dragging]:rounded-lg data-[dnd-dragging]:bg-white data-[dnd-dragging]:shadow-lg data-[dnd-placeholder]:rounded-lg data-[dnd-placeholder]:bg-neutral-100 [&[data-dnd-placeholder]_div]:invisible"
          data-flip-id={todoId}
          // Focusable so keyboard users can select, and so the library's
          // keyboard sorting can pick the row up.
          aria-selected={isSelected}
          role="option"
          tabIndex={0}
          // Selection happens on pointer down (not click) so a task is
          // already selected when a drag starts, and stays highlighted
          // while dragged.
          onPointerDown={() => selectTodo(todoId)}
          // The guard keeps a fast double-toggle of the checkbox from
          // dropping the row into edit mode.
          onDoubleClick={(event) => {
            if (!(event.target instanceof HTMLInputElement)) {
              startEditing()
            }
          }}
          // The pane behind us opens its own menu on background right-clicks;
          // keep row right-clicks from reaching it so only the row menu opens.
          onContextMenu={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              selectTodo(todoId)
            }
          }}
        >
          {/* Both modes render the same element tree — a branch returning a
              different wrapper would remount the row and kill the css
              transition into edit mode. */}
          <TaskRowCard
            isEditing={isEditing}
            isSelected={isSelected}
            showProject={showProject}
            todoId={todoId}
          >
            {isEditing ? (
              <input
                ref={initInput}
                className="min-w-0 flex-1 select-text bg-transparent p-0 text-neutral-800 outline-none"
                onBlur={commitEdit}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  event.stopPropagation()
                  if (event.key === "Enter") {
                    commitEdit()
                  } else if (event.key === "Escape") {
                    cancelEdit()
                  }
                }}
                value={draft}
              />
            ) : undefined}
          </TaskRowCard>
        </li>
      }
    >
      <ContextMenuItem onClick={toggleTodo}>
        {isCompleted ? "Mark incomplete" : "Mark complete"}
      </ContextMenuItem>
      <ContextMenuItem danger onClick={deleteTodo}>
        Delete
      </ContextMenuItem>
    </ContextMenu>
  )
}
