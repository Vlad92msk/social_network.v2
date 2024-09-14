import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { CookieType } from '../../types/cookie'
import { messagesApiInstance } from '../../../apiInstance/messages.instance'

export const messagesApi = createApi({
  reducerPath: 'API_messages',
  baseQuery: fetchBaseQuery({
    prepareHeaders: (headers, { getState }) => {
      const state = getState()
      // @ts-ignore
      const profileId = state.profile.id
      // @ts-ignore
      const userInfoId = state.profile.user_info.id

      headers.set(CookieType.USER_PROFILE_ID, String(profileId));
      headers.set(CookieType.USER_INFO_ID, String(userInfoId));
      return headers;
    },
  }),
  endpoints: (builder) => ({
    create: builder.mutation<
          ReturnType<typeof messagesApiInstance.create>,
          Parameters<typeof messagesApiInstance.createInit>[0]
        >({
          // query: messagesApiInstance.createInit,
          query: (params) => {
            const { url, ...rest } = messagesApiInstance.createInit(params)
            return ({ url, ...rest })
          },
        }),
    findAll: builder.query<
          ReturnType<typeof messagesApiInstance.findAll>,
          Parameters<typeof messagesApiInstance.findAllInit>[0]
        >({
          // query: messagesApiInstance.findAllInit,
          query: (params) => {
            const { url, ...rest } = messagesApiInstance.findAllInit(params)
            return ({ url, ...rest })
          },
        }),
    findOne: builder.query<
          ReturnType<typeof messagesApiInstance.findOne>,
          Parameters<typeof messagesApiInstance.findOneInit>[0]
        >({
          // query: messagesApiInstance.findOneInit,
          query: (params) => {
            const { url, ...rest } = messagesApiInstance.findOneInit(params)
            return ({ url, ...rest })
          },
        }),
    update: builder.mutation<
          ReturnType<typeof messagesApiInstance.update>,
          Parameters<typeof messagesApiInstance.updateInit>[0]
        >({
          // query: messagesApiInstance.updateInit,
          query: (params) => {
            const { url, ...rest } = messagesApiInstance.updateInit(params)
            return ({ url, ...rest })
          },
        }),
    remove: builder.mutation<
          ReturnType<typeof messagesApiInstance.remove>,
          Parameters<typeof messagesApiInstance.removeInit>[0]
        >({
          // query: messagesApiInstance.removeInit,
          query: (params) => {
            const { url, ...rest } = messagesApiInstance.removeInit(params)
            return ({ url, ...rest })
          },
        }),
    markAsDelivered: builder.mutation<
          ReturnType<typeof messagesApiInstance.markAsDelivered>,
          Parameters<typeof messagesApiInstance.markAsDeliveredInit>[0]
        >({
          // query: messagesApiInstance.markAsDeliveredInit,
          query: (params) => {
            const { url, ...rest } = messagesApiInstance.markAsDeliveredInit(params)
            return ({ url, ...rest })
          },
        }),
    markAsRead: builder.mutation<
          ReturnType<typeof messagesApiInstance.markAsRead>,
          Parameters<typeof messagesApiInstance.markAsReadInit>[0]
        >({
          // query: messagesApiInstance.markAsReadInit,
          query: (params) => {
            const { url, ...rest } = messagesApiInstance.markAsReadInit(params)
            return ({ url, ...rest })
          },
        }),
    forwardMessage: builder.mutation<
          ReturnType<typeof messagesApiInstance.forwardMessage>,
          Parameters<typeof messagesApiInstance.forwardMessageInit>[0]
        >({
          // query: messagesApiInstance.forwardMessageInit,
          query: (params) => {
            const { url, ...rest } = messagesApiInstance.forwardMessageInit(params)
            return ({ url, ...rest })
          },
        }),
    replyToMessage: builder.mutation<
          ReturnType<typeof messagesApiInstance.replyToMessage>,
          Parameters<typeof messagesApiInstance.replyToMessageInit>[0]
        >({
          // query: messagesApiInstance.replyToMessageInit,
          query: (params) => {
            const { url, ...rest } = messagesApiInstance.replyToMessageInit(params)
            return ({ url, ...rest })
          },
        }),
    getAllMediaForMessage: builder.query<
          ReturnType<typeof messagesApiInstance.getAllMediaForMessage>,
          Parameters<typeof messagesApiInstance.getAllMediaForMessageInit>[0]
        >({
          // query: messagesApiInstance.getAllMediaForMessageInit,
          query: (params) => {
            const { url, ...rest } = messagesApiInstance.getAllMediaForMessageInit(params)
            return ({ url, ...rest })
          },
        }),
    getReplyChain: builder.query<
          ReturnType<typeof messagesApiInstance.getReplyChain>,
          Parameters<typeof messagesApiInstance.getReplyChainInit>[0]
        >({
          // query: messagesApiInstance.getReplyChainInit,
          query: (params) => {
            const { url, ...rest } = messagesApiInstance.getReplyChainInit(params)
            return ({ url, ...rest })
          },
        }),
    addReaction: builder.mutation<
          ReturnType<typeof messagesApiInstance.addReaction>,
          Parameters<typeof messagesApiInstance.addReactionInit>[0]
        >({
          // query: messagesApiInstance.addReactionInit,
          query: (params) => {
            const { url, ...rest } = messagesApiInstance.addReactionInit(params)
            return ({ url, ...rest })
          },
        }),
    getReactions: builder.query<
          ReturnType<typeof messagesApiInstance.getReactions>,
          Parameters<typeof messagesApiInstance.getReactionsInit>[0]
        >({
          // query: messagesApiInstance.getReactionsInit,
          query: (params) => {
            const { url, ...rest } = messagesApiInstance.getReactionsInit(params)
            return ({ url, ...rest })
          },
        }),
    removeReaction: builder.mutation<
          ReturnType<typeof messagesApiInstance.removeReaction>,
          Parameters<typeof messagesApiInstance.removeReactionInit>[0]
        >({
          // query: messagesApiInstance.removeReactionInit,
          query: (params) => {
            const { url, ...rest } = messagesApiInstance.removeReactionInit(params)
            return ({ url, ...rest })
          },
        }),
    fullTextSearch: builder.mutation<
          ReturnType<typeof messagesApiInstance.fullTextSearch>,
          Parameters<typeof messagesApiInstance.fullTextSearchInit>[0]
        >({
          // query: messagesApiInstance.fullTextSearchInit,
          query: (params) => {
            const { url, ...rest } = messagesApiInstance.fullTextSearchInit(params)
            return ({ url, ...rest })
          },
        }),
    getReactionCount: builder.query<
          ReturnType<typeof messagesApiInstance.getReactionCount>,
          Parameters<typeof messagesApiInstance.getReactionCountInit>[0]
        >({
          // query: messagesApiInstance.getReactionCountInit,
          query: (params) => {
            const { url, ...rest } = messagesApiInstance.getReactionCountInit(params)
            return ({ url, ...rest })
          },
        }),
    hasUserReacted: builder.mutation<
          ReturnType<typeof messagesApiInstance.hasUserReacted>,
          Parameters<typeof messagesApiInstance.hasUserReactedInit>[0]
        >({
          // query: messagesApiInstance.hasUserReactedInit,
          query: (params) => {
            const { url, ...rest } = messagesApiInstance.hasUserReactedInit(params)
            return ({ url, ...rest })
          },
        }),
    createTemporaryMessage: builder.mutation<
          ReturnType<typeof messagesApiInstance.createTemporaryMessage>,
          Parameters<typeof messagesApiInstance.createTemporaryMessageInit>[0]
        >({
          // query: messagesApiInstance.createTemporaryMessageInit,
          query: (params) => {
            const { url, ...rest } = messagesApiInstance.createTemporaryMessageInit(params)
            return ({ url, ...rest })
          },
        }),
  }),
})
