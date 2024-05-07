import { addDays, subDays } from 'date-fns'
import { get as lodashGet, set as lodashSet, random } from 'lodash'
import { create } from 'zustand'
import { Dialog, DialogResponse } from '@api/messenger/dialogs/types/dialogs.type'
import { Message } from '@api/messenger/dialogs/types/message.type'
import { UserInfo } from '@api/users/types/user.type'
import { AddedFile } from '@hooks'
import { getDialogByIDQuery } from '../../../../../../api/messenger/dialogs/queries'

interface ApiStatusState<T = any> {
  apiData: T | undefined
  apiStatus: boolean | undefined
  apiError: Error | undefined
}

const initialApiState: ApiStatusState = {
  apiData: undefined,
  apiStatus: undefined,
  apiError: undefined,
}

/**
 * Стейт
 */
interface CommunicateState {
  selectedDialog: ApiStatusState<DialogResponse>
  createMessage: Message
}
export type DialogInitial = Partial<CommunicateState>

/**
 * Сеттеры
 */
interface CommunicateSetters {
  onSubmitMessage: (user: UserInfo) => void
  onCreateMessage: (key: keyof CommunicateState['createMessage'], value: CommunicateState['createMessage'][keyof CommunicateState['createMessage']]) => void
  fetchSelectedDialog: (dialogId: string) => Promise<void>
}

/**
 * Геттеры
 */
interface CommunicateGetters {
  getCurrentDialog: () => ApiStatusState<DialogResponse>
}

/**
 * Итоговый Слайс
 */
export type MessengerDialogSlice = CommunicateState & CommunicateSetters & CommunicateGetters

const defaultInitState: CommunicateState = {
  selectedDialog: initialApiState,
  createMessage: {
    id: random(3, 1000).toString(),
    emojis: [],
    media: [],
    text: '',
    dateCreated: new Date(),
    author: undefined,
    dateRead: addDays(new Date(), 1),
    forwardMessageId: undefined,
    dateDeliver: subDays(new Date(), 1),
  },
}
export const createDialogStore = (
  initState: DialogInitial = {},
) => create<MessengerDialogSlice>((set, get) => ({
  ...defaultInitState,
  ...initState,
  onSubmitMessage: (user) => {
    const prev = get().selectedDialog
    const curr = get().createMessage

    const newMessage: Message = {
      ...defaultInitState.createMessage,
      ...curr,
      author: user,
    }

    // @ts-ignore
    const msgsPrev: Message[] = lodashGet(prev, 'apiData.messages')
    const result = lodashSet(prev, 'apiData.messages', [...msgsPrev, newMessage])

    return set({
      selectedDialog: result,
      createMessage: defaultInitState.createMessage,
    })
  },
  onCreateMessage: (key, value) => set({ createMessage: { ...get().createMessage, [key]: value } }),
  fetchSelectedDialog: async (dialogId) => {
    const prev = get().selectedDialog
    set({ selectedDialog: { ...prev, apiStatus: true } })
    try {
      const dialog = await getDialogByIDQuery(dialogId)

      set({
        selectedDialog: {
          ...prev,
          apiStatus: false,
          apiData: dialog,
        },
      })
    } catch (error) {
      set({
        selectedDialog: {
          ...prev,
          apiStatus: false,
          apiError: error,
        },
      })
    }
  },
  getCurrentDialog: () => get().selectedDialog,
}))
