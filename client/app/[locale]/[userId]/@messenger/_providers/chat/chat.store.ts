import { create } from 'zustand'
import { AddedFile } from '@hooks'

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

/**
 * Стейт
 */
interface CommunicateState {
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
}

/**
 * Геттеры
 */
interface CommunicateGetters {
}

/**
 * Итоговый Слайс
 */
export type MessengerChatSlice = CommunicateState & CommunicateSetters & CommunicateGetters

const defaultInitState: CommunicateState = {
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
}))
