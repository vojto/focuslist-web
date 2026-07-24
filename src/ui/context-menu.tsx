import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu"
import type { ReactElement, ReactNode } from "react"

// Styled wrapper over Base UI's context menu; each entity composes its own
// items. The popup appears instantly (no data-starting-style rule) but fades
// out — the opacity transition only kicks in when data-ending-style applies
// during close.
export function ContextMenu({
  children,
  trigger,
}: {
  children: ReactNode
  trigger: ReactElement<Record<string, unknown>>
}) {
  return (
    <BaseContextMenu.Root>
      <BaseContextMenu.Trigger render={trigger} />
      <BaseContextMenu.Portal>
        <BaseContextMenu.Positioner className="z-50 outline-none">
          <BaseContextMenu.Popup className="min-w-36 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg outline-none transition-opacity duration-150 data-[ending-style]:opacity-0">
            {children}
          </BaseContextMenu.Popup>
        </BaseContextMenu.Positioner>
      </BaseContextMenu.Portal>
    </BaseContextMenu.Root>
  )
}

export function ContextMenuItem({
  children,
  danger = false,
  onClick,
}: {
  children: ReactNode
  danger?: boolean
  onClick: () => void
}) {
  const toneClass = danger
    ? "text-red-600 data-[highlighted]:bg-red-50"
    : "text-neutral-700 data-[highlighted]:bg-neutral-100"

  return (
    <BaseContextMenu.Item
      className={`mx-1 cursor-default select-none rounded-md px-2.5 py-1.5 text-sm outline-none ${toneClass}`}
      onClick={onClick}
    >
      {children}
    </BaseContextMenu.Item>
  )
}
