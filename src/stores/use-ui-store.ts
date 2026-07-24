import { create } from "zustand"
import { persist } from "zustand/middleware"

interface UiState {
  projectWidth?: number
  setProjectWidth: (projectWidth: number) => void
  setSidebarWidth: (sidebarWidth: number) => void
  sidebarWidth: number
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      projectWidth: undefined,
      setProjectWidth: (projectWidth) => set({ projectWidth }),
      setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),
      sidebarWidth: 224,
    }),
    {
      name: "focuslist-ui",
      partialize: ({ projectWidth, sidebarWidth }) => ({
        projectWidth,
        sidebarWidth,
      }),
      version: 1,
    },
  ),
)
