
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { CookieType } from '../../app/types/cookie';
import { RootState, store } from '../store'
import { messagesApiInstance } from '../../store/instance'
import { CreateMessageDto, PublicationType, UserAbout, MediaMetadata, DialogEntity, MessageEntity, ReactionEntity, CommentEntity, PostVisibility, PostEntity, Tag, MediaEntity, UserInfo, UpdateMessageDto } from '../../../swagger/messages/interfaces-messages'
import { SerializedError } from '@reduxjs/toolkit'
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

    findAll: builder.query<MessageEntity[], Parameters<typeof messagesApiInstance.findAll>[0]>({
      query: (params) => {
        const { url, init } = messagesApiInstance.findAllInit(params)
        return { url, ...init }
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

    addReaction: builder.mutation<any, Parameters<typeof messagesApiInstance.addReaction>[0]>({
      query: (params) => {
        const { url, init } = messagesApiInstance.addReactionInit(params)
        return { url, ...init }
      },
    }),

    getReactions: builder.query<any, Parameters<typeof messagesApiInstance.getReactions>[0]>({
      query: (params) => {
        const { url, init } = messagesApiInstance.getReactionsInit(params)
        return { url, ...init }
      },
    }),

    removeReaction: builder.mutation<any, Parameters<typeof messagesApiInstance.removeReaction>[0]>({
      query: (params) => {
        const { url, init } = messagesApiInstance.removeReactionInit(params)
        return { url, ...init }
      },
    }),

    fullTextSearch: builder.mutation<MessageEntity[], Parameters<typeof messagesApiInstance.fullTextSearch>[0]>({
      query: (params) => {
        const { url, init } = messagesApiInstance.fullTextSearchInit(params)
        return { url, ...init }
      },
    }),

    getReactionCount: builder.query<any, Parameters<typeof messagesApiInstance.getReactionCount>[0]>({
      query: (params) => {
        const { url, init } = messagesApiInstance.getReactionCountInit(params)
        return { url, ...init }
      },
    }),

    hasUserReacted: builder.mutation<any, Parameters<typeof messagesApiInstance.hasUserReacted>[0]>({
      query: (params) => {
        const { url, init } = messagesApiInstance.hasUserReactedInit(params)
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
export const MessagesApiApi = {
  
  create: (props: Parameters<typeof messagesApiInstance.create>[0]): Promise<QueryResult<MessageEntity>> =>
    store.dispatch(messagesApi.endpoints.create.initiate(props)),

  findAll: (props: Parameters<typeof messagesApiInstance.findAll>[0]): Promise<QueryResult<MessageEntity[]>> =>
    store.dispatch(messagesApi.endpoints.findAll.initiate(props)),

  findOne: (props: Parameters<typeof messagesApiInstance.findOne>[0]): Promise<QueryResult<MessageEntity>> =>
    store.dispatch(messagesApi.endpoints.findOne.initiate(props)),

  update: (props: Parameters<typeof messagesApiInstance.update>[0]): Promise<QueryResult<MessageEntity>> =>
    store.dispatch(messagesApi.endpoints.update.initiate(props)),

  remove: (props: Parameters<typeof messagesApiInstance.remove>[0]): Promise<QueryResult<any>> =>
    store.dispatch(messagesApi.endpoints.remove.initiate(props)),

  markAsDelivered: (props: Parameters<typeof messagesApiInstance.markAsDelivered>[0]): Promise<QueryResult<MessageEntity>> =>
    store.dispatch(messagesApi.endpoints.markAsDelivered.initiate(props)),

  markAsRead: (props: Parameters<typeof messagesApiInstance.markAsRead>[0]): Promise<QueryResult<MessageEntity>> =>
    store.dispatch(messagesApi.endpoints.markAsRead.initiate(props)),

  forwardMessage: (props: Parameters<typeof messagesApiInstance.forwardMessage>[0]): Promise<QueryResult<MessageEntity>> =>
    store.dispatch(messagesApi.endpoints.forwardMessage.initiate(props)),

  replyToMessage: (props: Parameters<typeof messagesApiInstance.replyToMessage>[0]): Promise<QueryResult<MessageEntity>> =>
    store.dispatch(messagesApi.endpoints.replyToMessage.initiate(props)),

  getAllMediaForMessage: (props: Parameters<typeof messagesApiInstance.getAllMediaForMessage>[0]): Promise<QueryResult<any>> =>
    store.dispatch(messagesApi.endpoints.getAllMediaForMessage.initiate(props)),

  getReplyChain: (props: Parameters<typeof messagesApiInstance.getReplyChain>[0]): Promise<QueryResult<MessageEntity[]>> =>
    store.dispatch(messagesApi.endpoints.getReplyChain.initiate(props)),

  addReaction: (props: Parameters<typeof messagesApiInstance.addReaction>[0]): Promise<QueryResult<any>> =>
    store.dispatch(messagesApi.endpoints.addReaction.initiate(props)),

  getReactions: (props: Parameters<typeof messagesApiInstance.getReactions>[0]): Promise<QueryResult<any>> =>
    store.dispatch(messagesApi.endpoints.getReactions.initiate(props)),

  removeReaction: (props: Parameters<typeof messagesApiInstance.removeReaction>[0]): Promise<QueryResult<any>> =>
    store.dispatch(messagesApi.endpoints.removeReaction.initiate(props)),

  fullTextSearch: (props: Parameters<typeof messagesApiInstance.fullTextSearch>[0]): Promise<QueryResult<MessageEntity[]>> =>
    store.dispatch(messagesApi.endpoints.fullTextSearch.initiate(props)),

  getReactionCount: (props: Parameters<typeof messagesApiInstance.getReactionCount>[0]): Promise<QueryResult<any>> =>
    store.dispatch(messagesApi.endpoints.getReactionCount.initiate(props)),

  hasUserReacted: (props: Parameters<typeof messagesApiInstance.hasUserReacted>[0]): Promise<QueryResult<any>> =>
    store.dispatch(messagesApi.endpoints.hasUserReacted.initiate(props)),

  createTemporaryMessage: (props: Parameters<typeof messagesApiInstance.createTemporaryMessage>[0]): Promise<QueryResult<MessageEntity>> =>
    store.dispatch(messagesApi.endpoints.createTemporaryMessage.initiate(props))
};

// Экспорт типов для использования в других частях приложения
export type MessagesApiApiType = typeof MessagesApiApi
