import { addDays, subDays } from 'date-fns'
import { get as lodashGet, set as lodashSet, random } from 'lodash'
import { create } from 'zustand'
import { getDialogByIDQuery } from '@api/messenger/dialogs/queries'
import { Dialog, DialogResponse, DialogShort, SelectDialogType } from '@api/messenger/dialogs/types/dialogs.type'
import { Message } from '@api/messenger/dialogs/types/message.type'
import { UserInfo } from '@api/users/types/user.type'

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

export interface MessengerState {
  // RootState
  drawerStatus: 'open' | 'close'
  chatingPanelStatus: 'open' | 'close'

  // DialogSelected
  openedDialogIds: string[]

  // CommunicateState
  selectedDialog: ApiStatusState<DialogResponse>
  createMessage: Message

  // DialogListState
  dialogs?: Dialog[]
  dialogsShort?: DialogShort[]
  selectType: SelectDialogType
  filter: string
}

interface MessengerActions {
  // RootSetters
  setDrawerStatus: (newStatus: 'open' | 'close') => void
  setChatingPanelStatus: (newStatus: 'open' | 'close') => void
  setOpenedDialogIds: (ids: string[]) => void

  // DialogSelected
  onRemoveMessage: (msgId: string) => void
  onSubmitMessage: (user: UserInfo) => void
  onUpdateMessage: (newData: Partial<Message>) => void
  onCreateMessage: (key: keyof Message, value: Message[keyof Message]) => void
  fetchSelectedDialog: (dialogId: string) => Promise<void>
  getCurrentDialog: () => ApiStatusState<DialogResponse>

  // DialogListSetters
  setSelectType: (select: SelectDialogType) => void
  setFilter: (s: string) => void
  viewDialogList: () => DialogShort[]
}

export type MessengerStore = MessengerState & MessengerActions

const defaultInitState: MessengerState = {
  drawerStatus: 'open',
  chatingPanelStatus: 'close',
  openedDialogIds: [],
  selectedDialog: initialApiState,
  createMessage: {
    id: random(3, 1000).toString(),
    emojis: [],
    media: [],
    text: '',
    dateCreated: new Date(),
    author: undefined,
    dateRead: undefined,
    forwardMessageId: undefined,
    dateDeliver: subDays(new Date(), 2),
  },
  dialogs: undefined,
  dialogsShort: undefined,
  filter: '',
  selectType: SelectDialogType.PRIVATE,
}

export const createMessengerStore = (initState: Partial<MessengerState> = {}) => create<MessengerStore>((set, get) => ({
  ...defaultInitState,
  ...initState,

  setDrawerStatus: (newStatus) => set({ drawerStatus: newStatus }),
  setChatingPanelStatus: (newStatus) => set({ chatingPanelStatus: newStatus }),
  setOpenedDialogIds: (ids) => set({ openedDialogIds: ids }),

  getCurrentDialog: () => get().selectedDialog,
  onRemoveMessage: (msgId: string) => {
    const prev = get().selectedDialog
    const result = lodashSet(prev, 'apiData.messages', prev.apiData?.messages?.filter(({ id }) => id !== msgId))

    set({
      selectedDialog: result,
    })
  },
  onUpdateMessage: ({ id, ...rest }: Partial<Message>) => {
    const prev = get().selectedDialog
    console.log('id', id)
    console.log('rest', rest)
    const result = lodashSet(prev, 'apiData.messages', prev.apiData?.messages?.map((msg) => {
      if (msg.id === id) {
        return ({
          ...msg,
          ...rest,
        })
      }
      return msg
    }))

    set({
      selectedDialog: result,
    })
  },
  onSubmitMessage: (user) => {
    const prev = get().selectedDialog
    const curr = get().createMessage

    const newMessage: Message = {
      ...defaultInitState.createMessage,
      ...curr,
      author: user,
      id: random(3, 1000).toString(),
      forwardMessageId: 'dialog-message-1',
      dateCreated: new Date(),
    }

    const msgsPrev: Message[] = lodashGet(prev, 'apiData.messages', [])
    const result = lodashSet(prev, 'apiData.messages', [...msgsPrev, newMessage])

    set({
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
          apiError: error as Error,
        },
      })
    }
  },

  setSelectType: (select: SelectDialogType) => set({ selectType: select }),
  setFilter: (newFilter) => set({ filter: newFilter }),

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
}))
