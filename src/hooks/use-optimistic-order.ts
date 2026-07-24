import { useState } from "react"

/**
 * Bridges a synchronous deadline (e.g. a drop animation that starts the frame
 * a drag ends) with an async source of truth (a Dexie live query): applyOrder
 * re-sorts the rendered list immediately, and the override is dropped once
 * the stored list catches up (state adjustment during render, per React docs).
 */
export function useOptimisticOrder<T>(
  stored: readonly T[] | undefined,
  getId: (item: T) => number,
) {
  const [pendingOrder, setPendingOrder] = useState<readonly number[] | null>(
    null,
  )

  if (
    pendingOrder !== null &&
    stored?.length === pendingOrder.length &&
    stored.every((item, index) => getId(item) === pendingOrder[index])
  ) {
    setPendingOrder(null)
  }

  const applyOrder = (orderedIds: readonly number[]) => {
    setPendingOrder(orderedIds)
  }

  if (stored === undefined || pendingOrder === null) {
    return [stored, applyOrder] as const
  }
  const rank = new Map(pendingOrder.map((id, index) => [id, index]))
  const ordered = [...stored].sort(
    (a, b) =>
      (rank.get(getId(a)) ?? Infinity) - (rank.get(getId(b)) ?? Infinity),
  )
  return [ordered, applyOrder] as const
}
