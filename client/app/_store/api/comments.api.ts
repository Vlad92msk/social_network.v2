import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { CookieType } from '../../types/cookie'
import { commentsApiInstance } from '../../../apiInstance'

export const commentsApi = createApi({
  reducerPath: 'API_comments',
  baseQuery: fetchBaseQuery({
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as Record<string, any>
      const profileId = state.profile.id
      const userInfoId = state.profile.user_info.id

      headers.set(CookieType.USER_PROFILE_ID, String(profileId));
      headers.set(CookieType.USER_INFO_ID, String(userInfoId));
      return headers;
    },
  }),
  endpoints: (builder) => ({
    create: builder.mutation<
          ReturnType<typeof commentsApiInstance.create>,
          Parameters<typeof commentsApiInstance.createInit>[0]
        >({
          query: (params) => {
            const { url, ...rest } = commentsApiInstance.createInit(params)
            return ({ url, ...rest })
          },
        }),
    findAll: builder.query<
          ReturnType<typeof commentsApiInstance.findAll>,
          Parameters<typeof commentsApiInstance.findAllInit>[0]
        >({
          query: (params) => {
            const { url, ...rest } = commentsApiInstance.findAllInit(params)
            return ({ url, ...rest })
          },
        }),
    update: builder.mutation<
          ReturnType<typeof commentsApiInstance.update>,
          Parameters<typeof commentsApiInstance.updateInit>[0]
        >({
          query: (params) => {
            const { url, ...rest } = commentsApiInstance.updateInit(params)
            return ({ url, ...rest })
          },
        }),
    findOne: builder.query<
          ReturnType<typeof commentsApiInstance.findOne>,
          Parameters<typeof commentsApiInstance.findOneInit>[0]
        >({
          query: (params) => {
            const { url, ...rest } = commentsApiInstance.findOneInit(params)
            return ({ url, ...rest })
          },
        }),
    remove: builder.mutation<
          ReturnType<typeof commentsApiInstance.remove>,
          Parameters<typeof commentsApiInstance.removeInit>[0]
        >({
          query: (params) => {
            const { url, ...rest } = commentsApiInstance.removeInit(params)
            return ({ url, ...rest })
          },
        }),
    findCommentsByPost: builder.query<
          ReturnType<typeof commentsApiInstance.findCommentsByPost>,
          Parameters<typeof commentsApiInstance.findCommentsByPostInit>[0]
        >({
          query: (params) => {
            const { url, ...rest } = commentsApiInstance.findCommentsByPostInit(params)
            return ({ url, ...rest })
          },
        }),
    findCommentsByMedia: builder.query<
          ReturnType<typeof commentsApiInstance.findCommentsByMedia>,
          Parameters<typeof commentsApiInstance.findCommentsByMediaInit>[0]
        >({
          query: (params) => {
            const { url, ...rest } = commentsApiInstance.findCommentsByMediaInit(params)
            return ({ url, ...rest })
          },
        }),
    getChildComments: builder.query<
          ReturnType<typeof commentsApiInstance.getChildComments>,
          Parameters<typeof commentsApiInstance.getChildCommentsInit>[0]
        >({
          query: (params) => {
            const { url, ...rest } = commentsApiInstance.getChildCommentsInit(params)
            return ({ url, ...rest })
          },
        }),
    pinComment: builder.mutation<
          ReturnType<typeof commentsApiInstance.pinComment>,
          Parameters<typeof commentsApiInstance.pinCommentInit>[0]
        >({
          query: (params) => {
            const { url, ...rest } = commentsApiInstance.pinCommentInit(params)
            return ({ url, ...rest })
          },
        }),
    findPinnedComments: builder.query<
          ReturnType<typeof commentsApiInstance.findPinnedComments>,
          Parameters<typeof commentsApiInstance.findPinnedCommentsInit>[0]
        >({
          query: (params) => {
            const { url, ...rest } = commentsApiInstance.findPinnedCommentsInit(params)
            return ({ url, ...rest })
          },
        }),
  }),
})
