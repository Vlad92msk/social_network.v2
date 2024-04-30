import { create } from 'zustand'

/**
 * Стейт
 */
interface CommunicateState {
  drawerStatus: 'open' | 'close'
}
export type CommunicateInitial = Partial<CommunicateState>

/**
 * Сеттеры
 */
interface CommunicateSetters {
  setDrawerStatus: (newStatus: 'open' | 'close') => void;
}

/**
 * Геттеры
 */
interface CommunicateGetters {
}

/**
 * Итоговый Слайс
 */
export type MessengerCommunicateSlice = CommunicateState & CommunicateSetters & CommunicateGetters

const defaultInitState: CommunicateState = {
  drawerStatus: 'open',
}
export const createContactsStore = (
  initState: CommunicateInitial = {},
) => create<MessengerCommunicateSlice>((set, get) => ({
  ...defaultInitState,
  ...initState,
  setDrawerStatus: (newStatus) => set({ drawerStatus: newStatus }),

}))
