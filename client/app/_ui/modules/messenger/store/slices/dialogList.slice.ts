import { StateCreator } from 'zustand'
import { DialogShortDto } from '../../../../../../../swagger/dialogs/interfaces-dialogs'

export enum SelectDialogType {
  PRIVATE ='private',
  PUBLIC = 'public'
}

export interface DialogListSlice {
  dialogsShort?: DialogShortDto[]
  selectType: SelectDialogType
  filter: string
  setSelectType: (select: SelectDialogType) => void
  setFilter: (s: string) => void
  viewDialogList: () => DialogShortDto[]
}

export const createDialogListSlice: StateCreator<DialogListSlice, [], [], DialogListSlice> = (set, get) => ({
  dialogsShort: undefined,
  filter: '',
  selectType: SelectDialogType.PRIVATE,
  setSelectType: (select: SelectDialogType) => set((state) => ({ ...state, selectType: select })),
  setFilter: (newFilter) => set((state) => ({ ...state, filter: newFilter })),
  viewDialogList: () => {
    const { filter, dialogsShort, selectType } = get()
    if (!dialogsShort || dialogsShort.length === 0) return []
    const target = dialogsShort.filter(({ type }) => type === selectType)
    return target.filter(({ title, last_message }) => (
      title?.toLowerCase().includes(filter.toLowerCase())
      || last_message?.text.toLowerCase().includes(filter.toLowerCase())
    ))
  },
})
