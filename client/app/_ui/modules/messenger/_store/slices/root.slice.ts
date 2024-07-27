// RootSlice
import { StateCreator } from 'zustand'

export interface RootSlice {
  drawerStatus: 'open' | 'close'
  chatingPanelStatus: 'open' | 'close'
  setDrawerStatus: (newStatus: 'open' | 'close') => void
  setChatingPanelStatus: (newStatus: 'open' | 'close') => void
}

export const createRootSlice: StateCreator<RootSlice, [], [], RootSlice> = (set) => ({
  drawerStatus: 'open',
  chatingPanelStatus: 'close',
  setDrawerStatus: (newStatus) => set((state) => ({ ...state, drawerStatus: newStatus })),
  setChatingPanelStatus: (newStatus) => set((state) => ({ ...state, chatingPanelStatus: newStatus })),
})
