import { StateCreator } from 'zustand'
import { Dialog, DialogShort, SelectDialogType } from '@api/messenger/dialogs/types/dialogs.type'

export interface DialogListSlice {
  dialogs?: Dialog[]
  dialogsShort?: DialogShort[]
  selectType: SelectDialogType
  filter: string
  setSelectType: (select: SelectDialogType) => void
  setFilter: (s: string) => void
  viewDialogList: () => DialogShort[]
}

export const createDialogListSlice: StateCreator<DialogListSlice, [], [], DialogListSlice> = (set, get) => ({
  dialogs: undefined,
  dialogsShort: undefined,
  filter: '',
  selectType: SelectDialogType.PRIVATE,
  setSelectType: (select: SelectDialogType) => set((state) => ({ ...state, selectType: select })),
  setFilter: (newFilter) => set((state) => ({ ...state, filter: newFilter })),
  viewDialogList: () => {
    const { filter, dialogsShort, selectType } = get()
    if (!dialogsShort || dialogsShort.length === 0) return []
    const target = dialogsShort.filter(({ type }) => type === selectType)
    return target.filter(({ title, description, lastMessage }) => (
      title?.toLowerCase().includes(filter.toLowerCase())
      || description?.toLowerCase().includes(filter.toLowerCase())
      || lastMessage?.text.toLowerCase().includes(filter.toLowerCase())
    ))
  },
})
