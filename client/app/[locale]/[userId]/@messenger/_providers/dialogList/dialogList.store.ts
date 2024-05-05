import { create } from 'zustand'
import { Dialog, DialogShort, SelectDialogType } from '@api/messenger/dialogs/types/dialogs.type'

/**
 * Стейт
 */
interface DialogListState {
  dialogs?: Dialog[]
  dialogsShort?: DialogShort[]
  selectType: SelectDialogType
  filter: string
}
export type DialogListInitial = Partial<DialogListState>

/**
 * Сеттеры
 */
interface DialogListSetters {
  setSelectType: (select: SelectDialogType) => void
  setFilter: (s: string) => void;
  // fetchDialogs: () => Promise<void>
}

/**
 * Геттеры
 */
interface DialogListGetters {
  viewDialogList: () => DialogShort[]
}

/**
 * Итоговый Слайс
 */
export type MessengerDialogListSlice = DialogListState & DialogListSetters & DialogListGetters

const defaultInitState: DialogListState = {
  dialogs: undefined,
  dialogsShort: undefined,
  filter: '',
  selectType: SelectDialogType.PRIVATE,
}
export const createContactsStore = (
  initState: DialogListInitial = {},
) => create<MessengerDialogListSlice>((set, get) => ({
  ...defaultInitState,
  ...initState,
  setSelectType: (select: SelectDialogType) => set({ selectType: select }),
  setFilter: (newFilter) => set({ filter: newFilter }),
  viewDialogList: () => {
    const { filter, dialogsShort, selectType } = get()

    if (!dialogsShort || dialogsShort.length === 0) return []

    const target = dialogsShort.filter(({ type }) => type === selectType)

    return target.filter(({ title, description, lastMessage }) => (
      title?.toLowerCase().includes(filter)
      || description?.toLowerCase().includes(filter)
      || lastMessage?.text.toLowerCase().includes(filter)
    ))
  },
}))
