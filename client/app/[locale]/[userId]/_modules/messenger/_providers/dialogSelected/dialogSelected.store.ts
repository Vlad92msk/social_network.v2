import { create } from 'zustand'
import { DialogResponse } from '@api/messenger/dialogs/types/dialogs.type'
import { AddedFile } from '@hooks'
import { getDialogByIDQuery } from '../../_query/dialogs'

export interface MessagePropsResponse {
  id: string
  date: Date
  isFromMe: boolean
  emojis: any[]
  isDelivered: boolean
  isRead: boolean
  messege: {
    media: AddedFile[]
    text: string
    forwardMessageId?: string
  }
}

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
  chatMessages: MessagePropsResponse[]
  createMessage: {
    id?: string
    date?: Date
    media?: AddedFile[]
    text: string
    forwardMessageId?: string
  }
}
export type DialogInitial = Partial<CommunicateState>

/**
 * Сеттеры
 */
interface CommunicateSetters {
  onSubmitMessage: VoidFunction
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
  chatMessages: [
    {
      id: '1',
      date: new Date('01/02/2024'),
      emojis: [],
      isRead: false,
      isDelivered: false,
      isFromMe: true,
      messege: { media: [], forwardMessageId: undefined, text: 'text' },
    },
    {
      id: '2',
      date: new Date('02/02/2024'),
      emojis: [],
      isRead: false,
      isDelivered: false,
      isFromMe: false,
      messege: { media: [], forwardMessageId: undefined, text: 'text2222' },
    },
  ],
  createMessage: {
    id: '34',
    date: undefined,
    media: [],
    text: '',
  },
}
export const createDialogStore = (
  initState: DialogInitial = {},
) => create<MessengerDialogSlice>((set, get) => ({
  ...defaultInitState,
  ...initState,
  onSubmitMessage: () => {
    const prev = get().chatMessages
    const curr = get().createMessage

    return set({
      chatMessages: [
        ...prev,
        {
          id: '',
          date: new Date(),
          emojis: [],
          isRead: false,
          isDelivered: false,
          isFromMe: true,
          messege: { media: curr.media || [], forwardMessageId: curr.forwardMessageId, text: curr.text },
        },
      ],
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
