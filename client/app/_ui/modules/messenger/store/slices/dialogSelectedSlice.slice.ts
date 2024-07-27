// DialogSelectedSlice
import { subDays } from 'date-fns'
import { get as lodashGet, set as lodashSet, random } from 'lodash'
import { StateCreator } from 'zustand'
import { getDialogByIDQuery } from '@api/messenger/dialogs/queries'
import { DialogResponse } from '@api/messenger/dialogs/types/dialogs.type'
import { Message } from '@api/messenger/dialogs/types/message.type'
import { UserInfo } from '@api/users/types/user.type'
import { ApiStatusState, initialApiState } from '@types/apiStatus'


const initialMessage: Message = {
  id: random(3, 1000).toString(),
  emojis: [],
  media: [],
  text: '',
  dateCreated: new Date(),
  author: undefined,
  dateRead: undefined,
  forwardMessageId: undefined,
  dateDeliver: subDays(new Date(), 2),
}


export interface DialogSelectedSlice {
  openedDialogIds: string[]
  selectedDialog: ApiStatusState<DialogResponse>
  createMessage: Message
  setOpenedDialogIds: (ids: string[]) => void
  onRemoveMessage: (msgId: string) => void
  onSubmitMessage: (user: UserInfo) => void
  onUpdateMessage: (newData: Partial<Message>) => void
  onCreateMessage: (key: keyof Message, value: Message[keyof Message]) => void
  fetchSelectedDialog: (dialogId: string) => Promise<void>
  getCurrentDialog: () => ApiStatusState<DialogResponse>
}

export const createDialogSelectedSlice: StateCreator<DialogSelectedSlice, [], [], DialogSelectedSlice> = (set, get) => ({
  openedDialogIds: [],
  selectedDialog: initialApiState,
  createMessage: initialMessage,
  setOpenedDialogIds: (ids) => set((state) => ({ ...state, openedDialogIds: ids })),
  onRemoveMessage: (msgId) => {
    const prev = get().selectedDialog
    const result = lodashSet(prev, 'apiData.messages', prev.apiData?.messages?.filter(({ id }) => id !== msgId))
    set((state) => ({ ...state, selectedDialog: result }))
  },
  onUpdateMessage: ({ id, ...rest }) => {
    const prev = get().selectedDialog
    const result = lodashSet(prev, 'apiData.messages', prev.apiData?.messages?.map((msg) => {
      if (msg.id === id) {
        return { ...msg, ...rest }
      }
      return msg
    }))
    set((state) => ({ ...state, selectedDialog: result }))
  },
  onSubmitMessage: (user) => {
    const prev = get().selectedDialog
    const curr = get().createMessage
    const newMessage: Message = {
      ...get().createMessage,
      ...curr,
      author: user,
      id: random(3, 1000).toString(),
      forwardMessageId: 'dialog-message-1',
      dateCreated: new Date(),
    }
    const msgsPrev: Message[] = lodashGet(prev, 'apiData.messages', [])
    const result = lodashSet(prev, 'apiData.messages', [...msgsPrev, newMessage])
    set((state) => ({
      ...state,
      selectedDialog: result,
      createMessage: get().createMessage,
    }))
  },
  onCreateMessage: (key, value) => set((state) => ({ ...state, createMessage: { ...state.createMessage, [key]: value } })),
  fetchSelectedDialog: async (dialogId) => {
    const prev = get().selectedDialog
    set((state) => ({ ...state, selectedDialog: { ...prev, apiStatus: true } }))
    try {
      const dialog = await getDialogByIDQuery(dialogId)
      set((state) => ({
        ...state,
        selectedDialog: {
          ...prev,
          apiStatus: false,
          apiData: dialog,
        },
      }))
    } catch (error) {
      set((state) => ({
        ...state,
        selectedDialog: {
          ...prev,
          apiStatus: false,
          apiError: error as Error,
        },
      }))
    }
  },
  getCurrentDialog: () => get().selectedDialog,
})