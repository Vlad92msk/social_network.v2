import { create } from 'zustand'
import { createDialogListSlice, DialogListSlice } from './slices/dialogList.slice'
import { createRootSlice, RootSlice } from './slices/root.slice'

export interface MessengerState extends RootSlice, DialogListSlice {}

export const createMessengerStore = (initialState?: Partial<MessengerState>) => create<MessengerState>()((...a) => ({
  ...createRootSlice(...a),
  ...createDialogListSlice(...a),
  ...(initialState ?? {}),
}))
