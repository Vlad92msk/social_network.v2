import { create } from 'zustand'
import { createDialogListSlice, DialogListSlice } from './slices/dialogList.slice'
import { createDialogSelectedSlice, DialogSelectedSlice } from './slices/dialogSelectedSlice.slice'
import { createRootSlice, RootSlice } from './slices/root.slice'

export interface MessengerState extends RootSlice, DialogSelectedSlice, DialogListSlice {}

export const createMessengerStore = (initialState?: Partial<MessengerState>) => create<MessengerState>()((...a) => ({
  ...createRootSlice(...a),
  ...createDialogSelectedSlice(...a),
  ...createDialogListSlice(...a),
  ...(initialState ?? {}),
}))
