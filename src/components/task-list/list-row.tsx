import { useCell } from "../../store/hooks"
import { itemType } from "../../store/item-type"
import type { ListId, PaneId, TodoId } from "../../store/schema"
import SectionRow from "./section-row"
import TaskRow from "./task-row"

// Which of the two rows a todo draws as. The list itself cannot make this
// choice — a cell is read per id, and the list holds only the ids — so the
// branch lives one level down, in a component whose whole job is to read the
// type and hand the row off.
export default function ListRow({
  index,
  listId,
  paneId,
  todoId,
}: {
  index: number
  listId: ListId
  paneId: PaneId
  todoId: TodoId
}) {
  const type = itemType(useCell("todos", todoId, "type"))

  if (type === "section") {
    return (
      <SectionRow
        index={index}
        listId={listId}
        paneId={paneId}
        todoId={todoId}
      />
    )
  }
  return (
    <TaskRow index={index} listId={listId} paneId={paneId} todoId={todoId} />
  )
}
