import { StateCreator } from 'zustand'
import { UserInfoDto } from '../../../../../../../swagger/userInfo/interfaces-userInfo'

export interface DialogSelectedSlice {
  // Создаваемый / существующий
  isCreatable: boolean
  // Пользователь с которым создается диалог (для НОВЫХ создаваемых диалогов)
  selectUser?: UserInfoDto,
  // С каким пользователем планируется диалог (для тех с кем еще нет диалога)
  setSelectUSer: (user: UserInfoDto) => void
}

export const createDialogSelectedSlice: StateCreator<DialogSelectedSlice, [], [], DialogSelectedSlice> = (set, get) => ({
  isCreatable: false,
  setSelectUSer: (user) => set((state) => ({ ...state, selectUser: user, isCreatable: true })),
})
