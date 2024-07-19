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

  // CommunicateSetters
  onSubmitMessage: (user: UserInfo) => void
  onCreateMessage: (key: keyof Message, value: Message[keyof Message]) => void
  fetchSelectedDialog: (dialogId: string) => Promise<void>

  // DialogListSetters
  setSelectType: (select: SelectDialogType) => void
  setFilter: (s: string) => void

  // CommunicateGetters
  getCurrentDialog: () => ApiStatusState<DialogResponse>

  // DialogListGetters
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
    dateRead: addDays(new Date(), 3),
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

  onSubmitMessage: (user) => {
    const prev = get().selectedDialog
    const curr = get().createMessage

    const newMessage: Message = {
      ...defaultInitState.createMessage,
      ...curr,
      author: user,
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

  getCurrentDialog: () => get().selectedDialog,

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