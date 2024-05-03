import { create } from 'zustand'
import { Dialog } from '@api/messenger/communicateList/types'
import { AddedFile } from '@hooks'
import { getDialogsQuery } from '../../_query/communicateList/getDialogs.query'
import { RootInitial } from '../root'

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
  dialogs: ApiStatusState<Dialog[]>
  chatMessages: MessagePropsResponse[]
  createMessage: {
    id?: string
    date?: Date
    media?: AddedFile[]
    text: string
    forwardMessageId?: string
  }
}
export type ChatInitial = Partial<CommunicateState>

/**
 * Сеттеры
 */
interface CommunicateSetters {
  onSubmitMessage: VoidFunction
  onCreateMessage: (key: keyof CommunicateState['createMessage'], value: CommunicateState['createMessage'][keyof CommunicateState['createMessage']]) => void
  fetchDialogs: (userId: string, dialogId: string) => Promise<void>
}

/**
 * Геттеры
 */
interface CommunicateGetters {
  getDialogs: () => ApiStatusState<Dialog[]>
}

/**
 * Итоговый Слайс
 */
export type MessengerChatSlice = CommunicateState & CommunicateSetters & CommunicateGetters

const defaultInitState: CommunicateState = {
  dialogs: initialApiState,
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
export const createChatStore = (
  initState: ChatInitial = {},
) => create<MessengerChatSlice>((set, get) => ({
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
  fetchDialogs: async (userId: string, dialogId: string) => {
    const prev = get().dialogs
    set({ dialogs: { ...prev, apiStatus: true, apiError: undefined } })

    try {
      const dialogs = await getDialogsQuery(userId, dialogId)
      set({
        dialogs: {
          ...prev,
          apiStatus: false,
          apiData: dialogs,
        },
      })
    } catch (error) {
      set({
        dialogs: {
          ...prev,
          apiStatus: false,
          apiError: error,
        },
      })
    }
  },
  getDialogs: () => {
    const prev = get().dialogs
    return prev
  },
}))
