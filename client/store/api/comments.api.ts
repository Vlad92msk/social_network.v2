
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { CookieType } from '../../app/types/cookie';
import { RootState, store } from '../store'
import { commentsApiInstance } from '../../store/instance'
import { CreateCommentDto, PublicationType, UserAbout, MediaMetadata, DialogEntity, MessageEntity, ReactionEntity, CommentEntity, PostVisibility, PostEntity, Tag, MediaEntity, UserInfo, UpdateCommentDto, CommentWithChildCountDto, CommentResponseDto } from '../../../swagger/comments/interfaces-comments'
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

export const commentsApi = createApi({
  reducerPath: 'API_comments',
  tagTypes: ['Comments'],
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
      invalidatesTags: ['Comments'],
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
      invalidatesTags: ['Comments'],
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
      query: (params) => {
        const { url, init } = commentsApiInstance.findChildCommentsInit(params)
        return { url, ...init }
      },
    }),

    pinComment: builder.mutation<CommentEntity, Parameters<typeof commentsApiInstance.pinComment>[0]>({
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

// Типизированные функции-обертки в объекте
export const CommentsApiApi = {

  create: (props: Parameters<typeof commentsApiInstance.create>[0]): Promise<QueryResult<CommentEntity>> =>
    store.dispatch(commentsApi.endpoints.create.initiate(props)),

  findAll: (props: Parameters<typeof commentsApiInstance.findAll>[0]): Promise<QueryResult<CommentEntity[]>> =>
    store.dispatch(commentsApi.endpoints.findAll.initiate(props)),

  update: (props: Parameters<typeof commentsApiInstance.update>[0]): Promise<QueryResult<CommentEntity>> =>
    store.dispatch(commentsApi.endpoints.update.initiate(props)),

  findOne: (props: Parameters<typeof commentsApiInstance.findOne>[0]): Promise<QueryResult<CommentEntity>> =>
    store.dispatch(commentsApi.endpoints.findOne.initiate(props)),

  remove: (props: Parameters<typeof commentsApiInstance.remove>[0]): Promise<QueryResult<any>> =>
    store.dispatch(commentsApi.endpoints.remove.initiate(props)),

  findCommentsByPost: (props: Parameters<typeof commentsApiInstance.findComments>[0]): Promise<QueryResult<CommentResponseDto>> =>
    store.dispatch(commentsApi.endpoints.findComments.initiate(props)),

  getChildComments: (props: Parameters<typeof commentsApiInstance.findChildComments>[0]): Promise<QueryResult<CommentEntity[]>> =>
    store.dispatch(commentsApi.endpoints.findChildComments.initiate(props)),

  pinComment: (props: Parameters<typeof commentsApiInstance.pinComment>[0]): Promise<QueryResult<CommentEntity>> =>
    store.dispatch(commentsApi.endpoints.pinComment.initiate(props)),

  findPinnedComments: (props: Parameters<typeof commentsApiInstance.findPinnedComments>[0]): Promise<QueryResult<CommentEntity[]>> =>
    store.dispatch(commentsApi.endpoints.findPinnedComments.initiate(props))
};

// Экспорт типов для использования в других частях приложения
export type CommentsApiApiType = typeof CommentsApiApi
