import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { MessengerSliceActions } from '@ui/modules/messenger/store/messenger.slice'
import { without } from 'lodash'
import { DialogEntity, DialogShortDto, MessageEntity } from '../../../swagger/dialogs/interfaces-dialogs'
import { CookieType } from '../../app/types/cookie'
import { DialogEvents } from '../events/dialog-events-enum'
import { dialogsApiInstance } from '../instance'
import { RootState } from '../store'
import { getSocket } from '@ui/modules/messenger/store/dialogSocketMiddleware'

export const dialogsApi = createApi({
  reducerPath: 'API_dialogs',
  baseQuery: fetchBaseQuery({
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState
      const profileId = state.profile?.profile?.id
      const userInfoId = state.profile?.profile?.user_info?.id

      if (profileId) {
        headers.set(CookieType.USER_PROFILE_ID, String(profileId))
      }
      if (userInfoId) {
        headers.set(CookieType.USER_INFO_ID, String(userInfoId))
      }
      return headers
    },
  }),
  endpoints: (builder) => ({
    sendMessage: builder.mutation<MessageEntity, Parameters<typeof dialogsApiInstance.sendMessage>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.sendMessageInit(params)
        return { url, ...init }
      },
    }),

    create: builder.mutation<DialogEntity, Parameters<typeof dialogsApiInstance.create>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.createInit(params)
        return { url, ...init }
      },
    }),

    findAll: builder.query<DialogEntity[], Parameters<typeof dialogsApiInstance.findAll>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.findAllInit(params)
        return { url, ...init }
      },
    }),

    findOne: builder.query<DialogEntity, { id: string }>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.findOneInit(params)
        return { url, ...init }
      },
    }),

    findByUserShortDialog: builder.query<DialogShortDto[], Parameters<typeof dialogsApiInstance.findByUserShortDialog>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.findByUserShortDialogInit(params)
        return { url, ...init }
      },
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch },
      ) {
        const socket = getSocket()
        if (!socket) {
          console.error('WebSocket connection not available')
          return
        }

        try {
          await cacheDataLoaded

          // Обновить/добавить диалог
          const handleShortDialogUpdate = (updatedDialog: DialogShortDto) => {
            updateCachedData((draft) => {
              const index = draft.findIndex(dialog => dialog.id === updatedDialog.id)
              if (index === -1) {
                // Если диалог не найден, добавляем его в начало списка
                draft.unshift(updatedDialog)
              } else {
                // Если диалог найден, обновляем его
                draft[index] = updatedDialog
              }
            })
          }

          // Выйти из диалога
          const handleExitDialog = (exitDialogId: string) => {
            updateCachedData((draft) => {
              const dialogToRemove = draft.find((m) => m.id === exitDialogId)
              if (dialogToRemove) return without(draft, dialogToRemove)

              return draft
            })
            dispatch(MessengerSliceActions.setChattingPanelStatus('close'))
          }

          // Диалог был удален
          const handlRemoveDialog = (removedDialogId: string) => {
            updateCachedData((draft) => {
              const dialogToRemove = draft.find((m) => m.id === removedDialogId)
              if (dialogToRemove) return without(draft, dialogToRemove)

              return draft
            })
            dispatch(MessengerSliceActions.setChattingPanelStatus('close'))
          }

          socket.on(DialogEvents.DIALOG_SHORT_UPDATED, handleShortDialogUpdate)
          socket.on(DialogEvents.EXIT_DIALOG, handleExitDialog)
          socket.on(DialogEvents.REMOVE_DIALOG, handlRemoveDialog)

          await cacheEntryRemoved
          socket.off(DialogEvents.DIALOG_SHORT_UPDATED, handleShortDialogUpdate)
          socket.off(DialogEvents.EXIT_DIALOG, handleExitDialog)
          socket.off(DialogEvents.REMOVE_DIALOG, handlRemoveDialog)
        } catch {
          const currentSocket = getSocket()
          if (currentSocket) {
            currentSocket.off(DialogEvents.DIALOG_SHORT_UPDATED)
            currentSocket.off(DialogEvents.EXIT_DIALOG)
            currentSocket.off(DialogEvents.REMOVE_DIALOG)
          }
        }
      },
    }),

    update: builder.mutation<DialogEntity, Parameters<typeof dialogsApiInstance.update>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.updateInit(params)
        return { url, ...init }
      },
    }),

    remove: builder.mutation<void, Parameters<typeof dialogsApiInstance.remove>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.removeInit(params)
        return { url, ...init }
      },
    }),

    addParticipant: builder.mutation<DialogEntity, Parameters<typeof dialogsApiInstance.addParticipant>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.addParticipantInit(params)
        return { url, ...init }
      },
    }),

    removeParticipant: builder.mutation<DialogEntity, Parameters<typeof dialogsApiInstance.removeParticipant>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.removeParticipantInit(params)
        return { url, ...init }
      },
    }),

    addAdmin: builder.mutation<DialogEntity, Parameters<typeof dialogsApiInstance.addAdmin>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.addAdminInit(params)
        return { url, ...init }
      },
    }),

    removeAdmin: builder.mutation<DialogEntity, Parameters<typeof dialogsApiInstance.removeAdmin>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.removeAdminInit(params)
        return { url, ...init }
      },
    }),

    addFixedMessage: builder.mutation<DialogEntity, Parameters<typeof dialogsApiInstance.addFixedMessage>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.addFixedMessageInit(params)
        return { url, ...init }
      },
    }),

    removeFixedMessage: builder.mutation<DialogEntity, Parameters<typeof dialogsApiInstance.removeFixedMessage>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.removeFixedMessageInit(params)
        return { url, ...init }
      },
    }),

    getUnreadMessagesCount: builder.query<number, Parameters<typeof dialogsApiInstance.getUnreadMessagesCount>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.getUnreadMessagesCountInit(params)
        return { url, ...init }
      },
    }),

    markMessagesAsRead: builder.mutation<DialogEntity, Parameters<typeof dialogsApiInstance.markMessagesAsRead>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.markMessagesAsReadInit(params)
        return { url, ...init }
      },
    }),

    getAllMediaForDialog: builder.query<object[], Parameters<typeof dialogsApiInstance.getAllMediaForDialog>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.getAllMediaForDialogInit(params)
        return { url, ...init }
      },
    }),

    updateDialogImage: builder.mutation<DialogEntity, Parameters<typeof dialogsApiInstance.updateDialogImage>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.updateDialogImageInit(params)
        return { url, ...init }
      },
    }),

    updateDialogOptions: builder.mutation<DialogEntity, Parameters<typeof dialogsApiInstance.updateDialogOptions>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.updateDialogOptionsInit(params)
        return { url, ...init }
      },
    }),

    getDialogsByParticipant: builder.query<DialogEntity[], Parameters<typeof dialogsApiInstance.getDialogsByParticipant>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.getDialogsByParticipantInit(params)
        return { url, ...init }
      },
    }),

    getDialogParticipants: builder.query<object[], Parameters<typeof dialogsApiInstance.getDialogParticipants>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.getDialogParticipantsInit(params)
        return { url, ...init }
      },
    }),

    getDialogAdmins: builder.query<object[], Parameters<typeof dialogsApiInstance.getDialogAdmins>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.getDialogAdminsInit(params)
        return { url, ...init }
      },
    }),

    leaveDialog: builder.mutation<void, Parameters<typeof dialogsApiInstance.leaveDialog>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.leaveDialogInit(params)
        return { url, ...init }
      },
    }),

    findAllShortDialogs: builder.query<DialogShortDto[], Parameters<typeof dialogsApiInstance.findAllShortDialogs>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.findAllShortDialogsInit(params)
        return { url, ...init }
      },
    }),

    findOneShortDialog: builder.query<DialogShortDto, Parameters<typeof dialogsApiInstance.findOneShortDialog>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.findOneShortDialogInit(params)
        return { url, ...init }
      },
    }),
  }),
})
