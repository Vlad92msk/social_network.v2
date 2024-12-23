import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { CommentEntity, CommentResponseDto } from '../../../swagger/comments/interfaces-comments'
import { CookieType } from '../../app/types/cookie'
import { commentsApiInstance } from '../../store/instance'
import { RootState } from '../store'

export const commentsApi = createApi({
  reducerPath: 'API_comments',
  tagTypes: ['Comments', 'ChildComments'],
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
    credentials: 'include',
  }),
  endpoints: (builder) => ({

    create: builder.mutation<CommentEntity, Parameters<typeof commentsApiInstance.create>[0]>({
      invalidatesTags: ['Comments', 'ChildComments'],
      query: (params) => {
        const { url, init } = commentsApiInstance.createInit(params)
        return { url, ...init }
      },
    }),

    findAll: builder.query<CommentEntity[], Parameters<typeof commentsApiInstance.findAll>[0]>({
      providesTags: ['Comments'],
      query: (params) => {
        const { url, init } = commentsApiInstance.findAllInit(params)
        return { url, ...init }
      },
    }),

    update: builder.mutation<CommentEntity, Parameters<typeof commentsApiInstance.update>[0]>({
      invalidatesTags: ['Comments'],
      query: (params) => {
        const { url, init } = commentsApiInstance.updateInit(params)
        return { url, ...init }
      },
    }),

    findOne: builder.query<CommentEntity, Parameters<typeof commentsApiInstance.findOne>[0]>({
      query: (params) => {
        const { url, init } = commentsApiInstance.findOneInit(params)
        return { url, ...init }
      },
    }),

    remove: builder.mutation<any, Parameters<typeof commentsApiInstance.remove>[0]>({
      invalidatesTags: ['Comments', 'ChildComments'],
      query: (params) => {
        const { url, init } = commentsApiInstance.removeInit(params)
        return { url, ...init }
      },
    }),

    findComments: builder.query<CommentResponseDto, Parameters<typeof commentsApiInstance.findComments>[0]>({
      providesTags: ['Comments'],
      query: (params) => {
        const { url, init } = commentsApiInstance.findCommentsInit(params)
        return { url, ...init }
      },
    }),

    findChildComments: builder.query<CommentEntity[], Parameters<typeof commentsApiInstance.findChildComments>[0]>({
      providesTags: ['ChildComments'],
      query: (params) => {
        const { url, init } = commentsApiInstance.findChildCommentsInit(params)
        return { url, ...init }
      },
    }),

    pinComment: builder.mutation<CommentEntity, Parameters<typeof commentsApiInstance.pinComment>[0]>({
      invalidatesTags: ['Comments'],
      query: (params) => {
        const { url, init } = commentsApiInstance.pinCommentInit(params)
        return { url, ...init }
      },
    }),

    findPinnedComments: builder.query<CommentEntity[], Parameters<typeof commentsApiInstance.findPinnedComments>[0]>({
      query: (params) => {
        const { url, init } = commentsApiInstance.findPinnedCommentsInit(params)
        return { url, ...init }
      },
    }),
  }),
})
