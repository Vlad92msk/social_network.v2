import { create } from 'zustand'
import { createDialogListSlice, DialogListSlice } from './slices/dialogList.slice'

export interface MessengerState extends DialogListSlice {}

export const createMessengerStore = (initialState?: Partial<MessengerState>) => create<MessengerState>()((...a) => ({
  ...createDialogListSlice(...a),
  ...(initialState ?? {}),
}))
