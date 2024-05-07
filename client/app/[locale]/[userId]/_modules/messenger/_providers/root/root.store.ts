import { create } from 'zustand'

/**
 * Стейт
 */
interface RootState {
  drawerStatus: 'open' | 'close'
  chatingPanelStatus: 'open' | 'close'
  openedDialogIds: string[]
}
export type RootInitial = Partial<RootState>

/**
 * Сеттеры
 */
interface RootSetters {
  setDrawerStatus: (newStatus: 'open' | 'close') => void;
  setChatingPanelStatus: (newStatus: 'open' | 'close') => void;
  setOpenedDialogIds: (ids: string[]) => void;
}

/**
 * Геттеры
 */
interface RootGetters {
}

/**
 * Итоговый Слайс
 */
export type MessengerRootSlice = RootState & RootSetters & RootGetters

const defaultInitState: RootState = {
  drawerStatus: 'open',
  chatingPanelStatus: 'close',
  openedDialogIds: [],
}
export const createContactsStore = (
  initState: RootInitial = {},
) => create<MessengerRootSlice>()((set, get) => ({
  ...defaultInitState,
  ...initState,
  setDrawerStatus: (newStatus) => set({ drawerStatus: newStatus }),
  setChatingPanelStatus: (newStatus) => set({ chatingPanelStatus: newStatus }),
  setOpenedDialogIds: (ids) => set({ openedDialogIds: ids }),
}))
