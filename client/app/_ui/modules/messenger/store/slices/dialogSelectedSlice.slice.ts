import { StateCreator } from 'zustand'
import { UserInfoDto } from '../../../../../../../swagger/userInfo/interfaces-userInfo'

export interface DialogSelectedSlice {
  // ID открываемого диалога
  openedDialogId?: string
  setOpenDialogId: (user: string) => void
  // Создаваемый / существующий
  isCreatable: boolean
  selectUser?: UserInfoDto,
  // С каким пользователем планируется диалог (для тех с кем еще нет диалога)
  setSelectUSer: (user: UserInfoDto) => void
}

export const createDialogSelectedSlice: StateCreator<DialogSelectedSlice, [], [], DialogSelectedSlice> = (set, get) => ({
  isCreatable: true,
  openedDialogId: undefined,
  setOpenDialogId: (dialogId: string) => set((state) => ({ ...state, openedDialogId: dialogId })),
  setSelectUSer: (user) => set((state) => ({ ...state, selectUser: user })),

})
