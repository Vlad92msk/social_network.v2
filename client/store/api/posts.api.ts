import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { without } from 'lodash'
import { PostEntity, PostResponseDto } from '../../../swagger/posts/interfaces-posts'
import { CookieType } from '../../app/types/cookie'
import { postsApiInstance } from '../instance'
import { RootState } from '../store'

export const postsApi = createApi({
  reducerPath: 'API_posts',
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
  tagTypes: ['Posts'],
  endpoints: (builder) => ({

    create: builder.mutation<PostResponseDto, Parameters<typeof postsApiInstance.create>[0]>({
      // invalidatesTags: ['Posts'],
      query: (params) => {
        const { url, init } = postsApiInstance.createInit(params)
        return { url, ...init }
      },
      onQueryStarted: async (newPost, { dispatch, queryFulfilled }) => {
        try {
          const { data: createdPost } = await queryFulfilled
          dispatch(
            postsApi.util.updateQueryData('findAll', { owner_public_id: createdPost.author.public_id }, (draft) => {
              draft.push(createdPost)
            }),
          )
        } catch {
          // Если произошла ошибка, ничего не делаем
        }
      },
    }),

    findAll: builder.query<PostResponseDto[], Parameters<typeof postsApiInstance.findAll>[0]>({
      providesTags: ['Posts'],
      query: (params) => {
        const { url, init } = postsApiInstance.findAllInit(params)
        return { url, ...init }
      },
    }),

    findOne: builder.query<PostEntity, Parameters<typeof postsApiInstance.findOne>[0]>({
      query: (params) => {
        const { url, init } = postsApiInstance.findOneInit(params)
        return { url, ...init }
      },
    }),

    update: builder.mutation<PostResponseDto, Parameters<typeof postsApiInstance.update>[0]>({
      query: (params) => {
        const { url, init } = postsApiInstance.updateInit(params)
        return { url, ...init }
      },
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          // Ожидаем завершения запроса
          const { data: updatedPost } = await queryFulfilled

          // Обновляем кэш с реальными данными от сервера
          dispatch(
            postsApi.util.updateQueryData('findAll', {}, (draft) => {
              const index = draft.findIndex((post) => post.id === id)
              if (index !== -1) {
                draft[index] = updatedPost
              }
            }),
          )
        } catch {
          // patchResult.undo()
        }
      },
    }),

    remove: builder.mutation<void, Parameters<typeof postsApiInstance.remove>[0]>({
      // invalidatesTags: ['Posts'],
      query: (params) => {
        const { url, init } = postsApiInstance.removeInit(params)
        return { url, ...init }
      },
      async onQueryStarted(arg, { dispatch, queryFulfilled, getState }) {
        const state = getState() as RootState
        const userInfoId = state.profile?.profile?.user_info?.public_id

        const patchResult = dispatch(
          postsApi.util.updateQueryData('findAll', { owner_public_id: userInfoId }, (draft) => {
            const postToRemove = draft.find((post) => post.id === arg?.id)
            if (postToRemove) return without(draft, postToRemove) as PostResponseDto[]

            return draft // Возвращаем исходный массив, если пост не найден
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
    }),

    createRepost: builder.mutation<PostEntity, Parameters<typeof postsApiInstance.createRepost>[0]>({
      invalidatesTags: ['Posts'],
      query: (params) => {
        const { url, init } = postsApiInstance.createRepostInit(params)
        return { url, ...init }
      },
    }),

    createReply: builder.mutation<PostEntity, Parameters<typeof postsApiInstance.createReply>[0]>({
      query: (params) => {
        const { url, init } = postsApiInstance.createReplyInit(params)
        return { url, ...init }
      },
    }),

    getPinnedPosts: builder.query<PostEntity[], Parameters<typeof postsApiInstance.getPinnedPosts>[0]>({
      query: (params) => {
        const { url, init } = postsApiInstance.getPinnedPostsInit(params)
        return { url, ...init }
      },
    }),

    togglePinPost: builder.mutation<PostEntity, Parameters<typeof postsApiInstance.togglePinPost>[0]>({
      query: (params) => {
        const { url, init } = postsApiInstance.togglePinPostInit(params)
        return { url, ...init }
      },
      async onQueryStarted({ id }, { dispatch, queryFulfilled, getState }) {
        const state = getState() as RootState
        const userInfoId = state.profile?.profile?.user_info?.public_id

        // Обновляем кэш для текущего списка постов
        const patchResult = dispatch(
          postsApi.util.updateQueryData('findAll', { owner_public_id: userInfoId }, (draft) => {
            const post = draft.find((post) => post.id === id)
            if (post) {
              post.pinned = !post.pinned

              // Если пост закрепляется, перемещаем его в начало списка
              if (post.pinned) {
                const index = draft.indexOf(post)
                draft.splice(index, 1)
                draft.unshift(post)
              }
            }
            return draft
          }),
        )

        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
    }),

    updatePostVisibility: builder.mutation<PostEntity, Parameters<typeof postsApiInstance.updatePostVisibility>[0]>({
      query: (params) => {
        const { url, init } = postsApiInstance.updatePostVisibilityInit(params)
        return { url, ...init }
      },
    }),

    createForwardedPost: builder.mutation<PostEntity, Parameters<typeof postsApiInstance.createForwardedPost>[0]>({
      query: (params) => {
        const { url, init } = postsApiInstance.createForwardedPostInit(params)
        return { url, ...init }
      },
    }),

    getAllMediaForPost: builder.query<object[], Parameters<typeof postsApiInstance.getAllMediaForPost>[0]>({
      query: (params) => {
        const { url, init } = postsApiInstance.getAllMediaForPostInit(params)
        return { url, ...init }
      },
    }),

    updatePostLocation: builder.mutation<PostEntity, Parameters<typeof postsApiInstance.updatePostLocation>[0]>({
      query: (params) => {
        const { url, init } = postsApiInstance.updatePostLocationInit(params)
        return { url, ...init }
      },
    }),

    getPostsByLocation: builder.query<PostEntity[], Parameters<typeof postsApiInstance.getPostsByLocation>[0]>({
      query: (params) => {
        const { url, init } = postsApiInstance.getPostsByLocationInit(params)
        return { url, ...init }
      },
    }),

    getRepostsOfPost: builder.query<PostEntity[], Parameters<typeof postsApiInstance.getRepostsOfPost>[0]>({
      query: (params) => {
        const { url, init } = postsApiInstance.getRepostsOfPostInit(params)
        return { url, ...init }
      },
    }),

    getRepliesOfPost: builder.query<PostEntity[], Parameters<typeof postsApiInstance.getRepliesOfPost>[0]>({
      query: (params) => {
        const { url, init } = postsApiInstance.getRepliesOfPostInit(params)
        return { url, ...init }
      },
    }),

    getForwardsOfPost: builder.query<PostEntity[], Parameters<typeof postsApiInstance.getForwardsOfPost>[0]>({
      query: (params) => {
        const { url, init } = postsApiInstance.getForwardsOfPostInit(params)
        return { url, ...init }
      },
    }),

    getAllRelatedPosts: builder.query<PostEntity[], Parameters<typeof postsApiInstance.getAllRelatedPosts>[0]>({
      query: (params) => {
        const { url, init } = postsApiInstance.getAllRelatedPostsInit(params)
        return { url, ...init }
      },
    }),

    getReplyChain: builder.query<PostEntity[], Parameters<typeof postsApiInstance.getReplyChain>[0]>({
      query: (params) => {
        const { url, init } = postsApiInstance.getReplyChainInit(params)
        return { url, ...init }
      },
    }),

    incrementViewCount: builder.mutation<PostEntity, Parameters<typeof postsApiInstance.incrementViewCount>[0]>({
      query: (params) => {
        const { url, init } = postsApiInstance.incrementViewCountInit(params)
        return { url, ...init }
      },
    }),
  }),
})
