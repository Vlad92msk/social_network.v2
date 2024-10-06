// RootSlice
import { StateCreator } from 'zustand'

export interface RootSlice {
  drawerStatus: 'open' | 'close'
  chatingPanelStatus: 'open' | 'close'
  openDialogId: string
  setOpenDialogId: (openDialogId: string) => void,
  setDrawerStatus: (newStatus: 'open' | 'close') => void
  setChatingPanelStatus: (newStatus: 'open' | 'close') => void
}

export const createRootSlice: StateCreator<RootSlice, [], [], RootSlice> = (set) => ({
  drawerStatus: 'open',
  chatingPanelStatus: 'close',
  openDialogId: '',
  setOpenDialogId: (openDialogId: string) => set((state) => ({ ...state, openDialogId })),
  setDrawerStatus: (newStatus) => set((state) => ({ ...state, drawerStatus: newStatus })),
  setChatingPanelStatus: (newStatus) => set((state) => ({ ...state, chatingPanelStatus: newStatus })),
})
