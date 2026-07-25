// Projects and todos can exist without a name: creating one adds the row
// immediately and leaves naming to the inline editor. Everything that
// renders a name runs it through here first, so the "not named yet" state
// looks the same in the sidebar, in a pane title, and in a task row.

export const PROJECT_PLACEHOLDER_NAME = "New Project"
export const TODO_PLACEHOLDER_TITLE = "New Task"
export const SECTION_PLACEHOLDER_NAME = "New Section"

export function displayName(name: string | undefined, placeholder: string) {
  const isPlaceholder = (name ?? "").trim() === ""
  return { isPlaceholder, text: isPlaceholder ? placeholder : (name ?? "") }
}
