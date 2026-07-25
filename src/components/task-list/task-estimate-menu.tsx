import { useCell, useDb } from "../../store/hooks"
import { setTodoEstimate } from "../../store/operations/todos"
import type { TodoId } from "../../store/schema"
import {
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSubmenu,
} from "../../ui/context-menu"
import { NO_ESTIMATE, TASK_ESTIMATES } from "../../ui/task-estimates"

// The row menu's estimate submenu: the whole catalog as one-of-many, led by
// the choice of no estimate at all — which is what a task starts with, and
// the only way back to it. Its own component so the row's menu stays a short
// list of what a task can do.
export default function TaskEstimateMenu({ todoId }: { todoId: TodoId }) {
  const db = useDb()
  const estimate = useCell("todos", todoId, "estimate")

  return (
    <ContextMenuSubmenu label="Estimate">
      <ContextMenuRadioGroup
        onValueChange={(nextEstimate) => {
          setTodoEstimate(db, todoId, nextEstimate)
        }}
        value={estimate ?? ""}
      >
        <ContextMenuRadioItem value="">{NO_ESTIMATE.name}</ContextMenuRadioItem>
        {Object.entries(TASK_ESTIMATES).map(([estimateName, { name }]) => (
          <ContextMenuRadioItem key={estimateName} value={estimateName}>
            {name}
          </ContextMenuRadioItem>
        ))}
      </ContextMenuRadioGroup>
    </ContextMenuSubmenu>
  )
}
