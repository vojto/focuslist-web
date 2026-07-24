import { create } from "zustand"
import { persist } from "zustand/middleware"

interface UiState {
  projectWidth?: number
  setProjectWidth: (projectWidth: number) => void
  selectedProjectId?: number
  setSelectedProjectId: (selectedProjectId: number | undefined) => void
  setSidebarWidth: (sidebarWidth: number) => void
  sidebarWidth: number
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      projectWidth: undefined,
      setProjectWidth: (projectWidth) => set({ projectWidth }),
      selectedProjectId: undefined,
      setSelectedProjectId: (selectedProjectId) => set({ selectedProjectId }),
      setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),
      sidebarWidth: 224,
    }),
    {
      name: "focuslist-ui",
      partialize: ({ projectWidth, selectedProjectId, sidebarWidth }) => ({
        projectWidth,
        selectedProjectId,
        sidebarWidth,
      }),
      version: 1,
    },
  ),
)
