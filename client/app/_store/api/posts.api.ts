import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { postsApiInstance } from '../../../apiInstance/posts.instance'

export const postsApi = createApi({
  reducerPath: 'API_posts',
  baseQuery: fetchBaseQuery({
    // baseUrl: '',
    // prepareHeaders: (headers, { getState }) => {
    //   // @ts-ignore
    //   const token = (getState()).auth.token;
    //   if (token) {
    //     headers.set('authorization', `Bearer ${token}`);
    //   }
    //   return headers;
    // },
  }),
  endpoints: (builder) => ({
    create: builder.mutation<
          ReturnType<typeof postsApiInstance.create>,
          Parameters<typeof postsApiInstance.createInit>[0]
        >({
          // query: postsApiInstance.createInit,
          query: (params) => {
            const { url, ...rest } = postsApiInstance.createInit(params)
            return ({ url, ...rest })
          },
        }),
    findAll: builder.query<
          ReturnType<typeof postsApiInstance.findAll>,
          Parameters<typeof postsApiInstance.findAllInit>[0]
        >({
          // query: postsApiInstance.findAllInit,
          query: (params) => {
            const { url, ...rest } = postsApiInstance.findAllInit(params)
            return ({ url, ...rest })
          },
        }),
    findOne: builder.query<
          ReturnType<typeof postsApiInstance.findOne>,
          Parameters<typeof postsApiInstance.findOneInit>[0]
        >({
          // query: postsApiInstance.findOneInit,
          query: (params) => {
            const { url, ...rest } = postsApiInstance.findOneInit(params)
            return ({ url, ...rest })
          },
        }),
    update: builder.mutation<
          ReturnType<typeof postsApiInstance.update>,
          Parameters<typeof postsApiInstance.updateInit>[0]
        >({
          // query: postsApiInstance.updateInit,
          query: (params) => {
            const { url, ...rest } = postsApiInstance.updateInit(params)
            return ({ url, ...rest })
          },
        }),
    remove: builder.mutation<
          ReturnType<typeof postsApiInstance.remove>,
          Parameters<typeof postsApiInstance.removeInit>[0]
        >({
          // query: postsApiInstance.removeInit,
          query: (params) => {
            const { url, ...rest } = postsApiInstance.removeInit(params)
            return ({ url, ...rest })
          },
        }),
    createRepost: builder.mutation<
          ReturnType<typeof postsApiInstance.createRepost>,
          Parameters<typeof postsApiInstance.createRepostInit>[0]
        >({
          // query: postsApiInstance.createRepostInit,
          query: (params) => {
            const { url, ...rest } = postsApiInstance.createRepostInit(params)
            return ({ url, ...rest })
          },
        }),
    createReply: builder.mutation<
          ReturnType<typeof postsApiInstance.createReply>,
          Parameters<typeof postsApiInstance.createReplyInit>[0]
        >({
          // query: postsApiInstance.createReplyInit,
          query: (params) => {
            const { url, ...rest } = postsApiInstance.createReplyInit(params)
            return ({ url, ...rest })
          },
        }),
    togglePinPost: builder.mutation<
          ReturnType<typeof postsApiInstance.togglePinPost>,
          Parameters<typeof postsApiInstance.togglePinPostInit>[0]
        >({
          // query: postsApiInstance.togglePinPostInit,
          query: (params) => {
            const { url, ...rest } = postsApiInstance.togglePinPostInit(params)
            return ({ url, ...rest })
          },
        }),
    updatePostVisibility: builder.mutation<
          ReturnType<typeof postsApiInstance.updatePostVisibility>,
          Parameters<typeof postsApiInstance.updatePostVisibilityInit>[0]
        >({
          // query: postsApiInstance.updatePostVisibilityInit,
          query: (params) => {
            const { url, ...rest } = postsApiInstance.updatePostVisibilityInit(params)
            return ({ url, ...rest })
          },
        }),
    createForwardedPost: builder.mutation<
          ReturnType<typeof postsApiInstance.createForwardedPost>,
          Parameters<typeof postsApiInstance.createForwardedPostInit>[0]
        >({
          // query: postsApiInstance.createForwardedPostInit,
          query: (params) => {
            const { url, ...rest } = postsApiInstance.createForwardedPostInit(params)
            return ({ url, ...rest })
          },
        }),
    getAllMediaForPost: builder.query<
          ReturnType<typeof postsApiInstance.getAllMediaForPost>,
          Parameters<typeof postsApiInstance.getAllMediaForPostInit>[0]
        >({
          // query: postsApiInstance.getAllMediaForPostInit,
          query: (params) => {
            const { url, ...rest } = postsApiInstance.getAllMediaForPostInit(params)
            return ({ url, ...rest })
          },
        }),
    updatePostLocation: builder.mutation<
          ReturnType<typeof postsApiInstance.updatePostLocation>,
          Parameters<typeof postsApiInstance.updatePostLocationInit>[0]
        >({
          // query: postsApiInstance.updatePostLocationInit,
          query: (params) => {
            const { url, ...rest } = postsApiInstance.updatePostLocationInit(params)
            return ({ url, ...rest })
          },
        }),
    getPostsByLocation: builder.query<
          ReturnType<typeof postsApiInstance.getPostsByLocation>,
          Parameters<typeof postsApiInstance.getPostsByLocationInit>[0]
        >({
          // query: postsApiInstance.getPostsByLocationInit,
          query: (params) => {
            const { url, ...rest } = postsApiInstance.getPostsByLocationInit(params)
            return ({ url, ...rest })
          },
        }),
    getRepostsOfPost: builder.query<
          ReturnType<typeof postsApiInstance.getRepostsOfPost>,
          Parameters<typeof postsApiInstance.getRepostsOfPostInit>[0]
        >({
          // query: postsApiInstance.getRepostsOfPostInit,
          query: (params) => {
            const { url, ...rest } = postsApiInstance.getRepostsOfPostInit(params)
            return ({ url, ...rest })
          },
        }),
    getRepliesOfPost: builder.query<
          ReturnType<typeof postsApiInstance.getRepliesOfPost>,
          Parameters<typeof postsApiInstance.getRepliesOfPostInit>[0]
        >({
          // query: postsApiInstance.getRepliesOfPostInit,
          query: (params) => {
            const { url, ...rest } = postsApiInstance.getRepliesOfPostInit(params)
            return ({ url, ...rest })
          },
        }),
    getForwardsOfPost: builder.query<
          ReturnType<typeof postsApiInstance.getForwardsOfPost>,
          Parameters<typeof postsApiInstance.getForwardsOfPostInit>[0]
        >({
          // query: postsApiInstance.getForwardsOfPostInit,
          query: (params) => {
            const { url, ...rest } = postsApiInstance.getForwardsOfPostInit(params)
            return ({ url, ...rest })
          },
        }),
    getAllRelatedPosts: builder.query<
          ReturnType<typeof postsApiInstance.getAllRelatedPosts>,
          Parameters<typeof postsApiInstance.getAllRelatedPostsInit>[0]
        >({
          // query: postsApiInstance.getAllRelatedPostsInit,
          query: (params) => {
            const { url, ...rest } = postsApiInstance.getAllRelatedPostsInit(params)
            return ({ url, ...rest })
          },
        }),
    getReplyChain: builder.query<
          ReturnType<typeof postsApiInstance.getReplyChain>,
          Parameters<typeof postsApiInstance.getReplyChainInit>[0]
        >({
          // query: postsApiInstance.getReplyChainInit,
          query: (params) => {
            const { url, ...rest } = postsApiInstance.getReplyChainInit(params)
            return ({ url, ...rest })
          },
        }),
    incrementViewCount: builder.mutation<
          ReturnType<typeof postsApiInstance.incrementViewCount>,
          Parameters<typeof postsApiInstance.incrementViewCountInit>[0]
        >({
          // query: postsApiInstance.incrementViewCountInit,
          query: (params) => {
            const { url, ...rest } = postsApiInstance.incrementViewCountInit(params)
            return ({ url, ...rest })
          },
        }),
  }),
})
