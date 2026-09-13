import { create } from 'zustand'

// Global dialogs that can be opened from anywhere (menus, sidebar, shortcuts).
type UiState = {
  newPlaylistFor: { trackId?: string } | null
  openNewPlaylist: (trackId?: string) => void
  closeNewPlaylist: () => void
}

export const useUi = create<UiState>((set) => ({
  newPlaylistFor: null,
  openNewPlaylist: (trackId) => set({ newPlaylistFor: { trackId } }),
  closeNewPlaylist: () => set({ newPlaylistFor: null }),
}))
