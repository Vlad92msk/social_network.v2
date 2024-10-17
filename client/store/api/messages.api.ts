import { SerializedError } from '@reduxjs/toolkit'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { without } from 'lodash'
import { getSocket } from '@ui/modules/messenger/store/dialogSocketMiddleware'
import { MessageEntity, MessagesResponseDto } from '../../../swagger/messages/interfaces-messages'
import { PostResponseDto } from '../../../swagger/posts/interfaces-posts'
import { CookieType } from '../../app/types/cookie'
import { DialogEvents } from '../events/dialog-events-enum'
import { messagesApiInstance } from '../instance'
import { RootState, store } from '../store'
// Тип для результатов запросов
type QueryResult<T> = {
  data?: T
  error?: SerializedError
  endpointName: string
  fulfilledTimeStamp?: number
  isError: boolean
  isLoading: boolean
  isSuccess: boolean
  isUninitialized: boolean
  requestId: string
  startedTimeStamp?: number
  status: 'pending' | 'fulfilled' | 'rejected'
}

export const messagesApi = createApi({
  reducerPath: 'API_messages',
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

    create: builder.mutation<MessageEntity, Parameters<typeof messagesApiInstance.create>[0]>({
      query: (params) => {
        const { url, init } = messagesApiInstance.createInit(params)
        return { url, ...init }
      },
    }),

    findAll: builder.query<MessagesResponseDto, Parameters<typeof messagesApiInstance.findAll>[0]>({
      query: (params) => {
        const { url, init } = messagesApiInstance.findAllInit(params)
        return { url, ...init }
      },
      serializeQueryArgs: ({ endpointName }) => endpointName,
      merge: (currentCache, newItems) => {
        // Убедимся, что мы не добавляем дубликаты сообщений
        const uniqueNewMessages = newItems.data.filter(
          (newMsg) => !currentCache.data.some((existingMsg) => existingMsg.id === newMsg.id),
        )
        currentCache.data.push(...uniqueNewMessages)
        currentCache.cursor = newItems.cursor
        currentCache.has_more = newItems.has_more
        currentCache.total = newItems.total
      },
      forceRefetch({ currentArg, previousArg }) {
        return JSON.stringify(currentArg) !== JSON.stringify(previousArg)
      },
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        const socket = getSocket()

        if (!socket) {
          console.error('Нет сокет соединения')
          return
        }

        try {
          // Ждем, пока начальные данные будут загружены
          await cacheDataLoaded

          // Установка слушателя для новых сообщений
          const handleNewMessage = ({ dialogId, message }: { dialogId: string; message: MessageEntity }) => {
            updateCachedData((draft) => {
              if (dialogId === arg.dialog_id) {
                draft.data.unshift(message)
                draft.total += 1
              }
            })
          }

          const handleChangedMessage = ({ dialogId, message }: { dialogId: string; message: MessageEntity }) => {
            updateCachedData((draft) => {
              if (dialogId === arg.dialog_id) {
                const index = draft.data.findIndex((m) => m.id === message.id)
                if (index !== -1) {
                  draft.data[index] = message
                }
              }
            })
          }

          const handleRemovedMessage = ({ dialogId, messageId }: { dialogId: string; messageId: string }) => {
            updateCachedData((draft) => {
              if (dialogId === arg.dialog_id) {
                draft.data = draft.data.filter((m) => m.id !== messageId)
                draft.total -= 1
              }
            })
          }

          socket.on(DialogEvents.NEW_MESSAGE, handleNewMessage)
          socket.on(DialogEvents.CHANGED_MESSAGE, handleChangedMessage)
          socket.on(DialogEvents.REMOVE_MESSAGE, handleRemovedMessage)

          await cacheEntryRemoved
          socket.off(DialogEvents.NEW_MESSAGE, handleNewMessage)
          socket.off(DialogEvents.CHANGED_MESSAGE, handleChangedMessage)
          socket.off(DialogEvents.REMOVE_MESSAGE, handleRemovedMessage)
        } catch {
          const currentSocket = getSocket()
          if (currentSocket) {
            currentSocket.off(DialogEvents.NEW_MESSAGE)
            currentSocket.off(DialogEvents.CHANGED_MESSAGE)
            currentSocket.off(DialogEvents.REMOVE_MESSAGE)
          }
        }
      },
    }),

    findOne: builder.query<MessageEntity, Parameters<typeof messagesApiInstance.findOne>[0]>({
      query: (params) => {
        const { url, init } = messagesApiInstance.findOneInit(params)
        return { url, ...init }
      },
    }),

    update: builder.mutation<MessageEntity, Parameters<typeof messagesApiInstance.update>[0]>({
      query: (params) => {
        const { url, init } = messagesApiInstance.updateInit(params)
        return { url, ...init }
      },
    }),

    remove: builder.mutation<any, Parameters<typeof messagesApiInstance.remove>[0]>({
      query: (params) => {
        const { url, init } = messagesApiInstance.removeInit(params)
        return { url, ...init }
      },
    }),

    markAsDelivered: builder.mutation<MessageEntity, Parameters<typeof messagesApiInstance.markAsDelivered>[0]>({
      query: (params) => {
        const { url, init } = messagesApiInstance.markAsDeliveredInit(params)
        return { url, ...init }
      },
    }),

    markAsRead: builder.mutation<MessageEntity, Parameters<typeof messagesApiInstance.markAsRead>[0]>({
      query: (params) => {
        const { url, init } = messagesApiInstance.markAsReadInit(params)
        return { url, ...init }
      },
    }),

    forwardMessage: builder.mutation<MessageEntity, Parameters<typeof messagesApiInstance.forwardMessage>[0]>({
      query: (params) => {
        const { url, init } = messagesApiInstance.forwardMessageInit(params)
        return { url, ...init }
      },
    }),

    replyToMessage: builder.mutation<MessageEntity, Parameters<typeof messagesApiInstance.replyToMessage>[0]>({
      query: (params) => {
        const { url, init } = messagesApiInstance.replyToMessageInit(params)
        return { url, ...init }
      },
    }),

    getAllMediaForMessage: builder.query<any, Parameters<typeof messagesApiInstance.getAllMediaForMessage>[0]>({
      query: (params) => {
        const { url, init } = messagesApiInstance.getAllMediaForMessageInit(params)
        return { url, ...init }
      },
    }),

    getReplyChain: builder.query<MessageEntity[], Parameters<typeof messagesApiInstance.getReplyChain>[0]>({
      query: (params) => {
        const { url, init } = messagesApiInstance.getReplyChainInit(params)
        return { url, ...init }
      },
    }),

    fullTextSearch: builder.mutation<MessageEntity[], Parameters<typeof messagesApiInstance.fullTextSearch>[0]>({
      query: (params) => {
        const { url, init } = messagesApiInstance.fullTextSearchInit(params)
        return { url, ...init }
      },
    }),

    createTemporaryMessage: builder.mutation<MessageEntity, Parameters<typeof messagesApiInstance.createTemporaryMessage>[0]>({
      query: (params) => {
        const { url, init } = messagesApiInstance.createTemporaryMessageInit(params)
        return { url, ...init }
      },
    }),
  }),
})

// Типизированные функции-обертки в объекте
// export const MessagesApiApi = {
//
//   create: (props: Parameters<typeof messagesApiInstance.create>[0]): Promise<QueryResult<MessageEntity>> => store.dispatch(messagesApi.endpoints.create.initiate(props)),
//
//   findAll: (props: Parameters<typeof messagesApiInstance.findAll>[0]): Promise<QueryResult<MessageEntity[]>> => store.dispatch(messagesApi.endpoints.findAll.initiate(props)),
//
//   findOne: (props: Parameters<typeof messagesApiInstance.findOne>[0]): Promise<QueryResult<MessageEntity>> => store.dispatch(messagesApi.endpoints.findOne.initiate(props)),
//
//   update: (props: Parameters<typeof messagesApiInstance.update>[0]): Promise<QueryResult<MessageEntity>> => store.dispatch(messagesApi.endpoints.update.initiate(props)),
//
//   remove: (props: Parameters<typeof messagesApiInstance.remove>[0]): Promise<QueryResult<any>> => store.dispatch(messagesApi.endpoints.remove.initiate(props)),
//
//   markAsDelivered: (props: Parameters<typeof messagesApiInstance.markAsDelivered>[0]): Promise<QueryResult<MessageEntity>> => store.dispatch(messagesApi.endpoints.markAsDelivered.initiate(props)),
//
//   markAsRead: (props: Parameters<typeof messagesApiInstance.markAsRead>[0]): Promise<QueryResult<MessageEntity>> => store.dispatch(messagesApi.endpoints.markAsRead.initiate(props)),
//
//   forwardMessage: (props: Parameters<typeof messagesApiInstance.forwardMessage>[0]): Promise<QueryResult<MessageEntity>> => store.dispatch(messagesApi.endpoints.forwardMessage.initiate(props)),
//
//   replyToMessage: (props: Parameters<typeof messagesApiInstance.replyToMessage>[0]): Promise<QueryResult<MessageEntity>> => store.dispatch(messagesApi.endpoints.replyToMessage.initiate(props)),
//
//   getAllMediaForMessage: (props: Parameters<typeof messagesApiInstance.getAllMediaForMessage>[0]): Promise<QueryResult<any>> => store.dispatch(messagesApi.endpoints.getAllMediaForMessage.initiate(props)),
//
//   getReplyChain: (props: Parameters<typeof messagesApiInstance.getReplyChain>[0]): Promise<QueryResult<MessageEntity[]>> => store.dispatch(messagesApi.endpoints.getReplyChain.initiate(props)),
//
//   fullTextSearch: (props: Parameters<typeof messagesApiInstance.fullTextSearch>[0]): Promise<QueryResult<MessageEntity[]>> => store.dispatch(messagesApi.endpoints.fullTextSearch.initiate(props)),
//
//   createTemporaryMessage: (props: Parameters<typeof messagesApiInstance.createTemporaryMessage>[0]): Promise<QueryResult<MessageEntity>> => store.dispatch(messagesApi.endpoints.createTemporaryMessage.initiate(props)),
// }
//
// // Экспорт типов для использования в других частях приложения
// export type MessagesApiApiType = typeof MessagesApiApi
