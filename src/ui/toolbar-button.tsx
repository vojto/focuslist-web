import type { ButtonHTMLAttributes } from "react"

type ToolbarButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

export default function ToolbarButton(props: ToolbarButtonProps) {
  return (
    <button
      className="flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 font-medium text-neutral-500 outline-none transition hover:border-neutral-950/10 active:border-transparent active:bg-neutral-950/5"
      type="button"
      {...props}
    />
  )
}
