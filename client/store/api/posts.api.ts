
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { CookieType } from '../../app/types/cookie';
import { RootState } from '../store'
import { postsApiInstance } from '../../store/instance';
import { PublicationType, UserAbout, MediaMetadata, Tag, DialogEntity, MessageEntity, ReactionEntity, CommentEntity, MediaEntity, UserInfo, PostVisibility, PostEntity, CreatePostDto, UpdatePostDto } from '../../../swagger/posts/interfaces-posts';

export const postsApi = createApi({
  reducerPath: 'API_posts',
  baseQuery: fetchBaseQuery({
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const profileId = state.profile?.profile?.id;
      const userInfoId = state.profile?.profile?.user_info?.id;

      if (profileId) {
        headers.set(CookieType.USER_PROFILE_ID, String(profileId));
      }
      if (userInfoId) {
        headers.set(CookieType.USER_INFO_ID, String(userInfoId));
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    
    create: builder.mutation<
      PostEntity,
      Parameters<typeof postsApiInstance.create>[0]
    >({
      query: (params) => {
        const { url, init } = postsApiInstance.createInit(params);
        return { url, ...init };
      },
    }),

    findAll: builder.query<
      PostEntity[],
      Parameters<typeof postsApiInstance.findAll>[0]
    >({
      query: (params) => {
        const { url, init } = postsApiInstance.findAllInit(params);
        return { url, ...init };
      },
    }),

    findOne: builder.query<
      PostEntity,
      Parameters<typeof postsApiInstance.findOne>[0]
    >({
      query: (params) => {
        const { url, init } = postsApiInstance.findOneInit(params);
        return { url, ...init };
      },
    }),

    update: builder.mutation<
      PostEntity,
      Parameters<typeof postsApiInstance.update>[0]
    >({
      query: (params) => {
        const { url, init } = postsApiInstance.updateInit(params);
        return { url, ...init };
      },
    }),

    remove: builder.mutation<
      any,
      Parameters<typeof postsApiInstance.remove>[0]
    >({
      query: (params) => {
        const { url, init } = postsApiInstance.removeInit(params);
        return { url, ...init };
      },
    }),

    createRepost: builder.mutation<
      PostEntity,
      Parameters<typeof postsApiInstance.createRepost>[0]
    >({
      query: (params) => {
        const { url, init } = postsApiInstance.createRepostInit(params);
        return { url, ...init };
      },
    }),

    createReply: builder.mutation<
      PostEntity,
      Parameters<typeof postsApiInstance.createReply>[0]
    >({
      query: (params) => {
        const { url, init } = postsApiInstance.createReplyInit(params);
        return { url, ...init };
      },
    }),

    getPinnedPosts: builder.query<
      PostEntity[],
      Parameters<typeof postsApiInstance.getPinnedPosts>[0]
    >({
      query: (params) => {
        const { url, init } = postsApiInstance.getPinnedPostsInit(params);
        return { url, ...init };
      },
    }),

    togglePinPost: builder.mutation<
      PostEntity,
      Parameters<typeof postsApiInstance.togglePinPost>[0]
    >({
      query: (params) => {
        const { url, init } = postsApiInstance.togglePinPostInit(params);
        return { url, ...init };
      },
    }),

    updatePostVisibility: builder.mutation<
      PostEntity,
      Parameters<typeof postsApiInstance.updatePostVisibility>[0]
    >({
      query: (params) => {
        const { url, init } = postsApiInstance.updatePostVisibilityInit(params);
        return { url, ...init };
      },
    }),

    createForwardedPost: builder.mutation<
      PostEntity,
      Parameters<typeof postsApiInstance.createForwardedPost>[0]
    >({
      query: (params) => {
        const { url, init } = postsApiInstance.createForwardedPostInit(params);
        return { url, ...init };
      },
    }),

    getAllMediaForPost: builder.query<
      object[],
      Parameters<typeof postsApiInstance.getAllMediaForPost>[0]
    >({
      query: (params) => {
        const { url, init } = postsApiInstance.getAllMediaForPostInit(params);
        return { url, ...init };
      },
    }),

    updatePostLocation: builder.mutation<
      PostEntity,
      Parameters<typeof postsApiInstance.updatePostLocation>[0]
    >({
      query: (params) => {
        const { url, init } = postsApiInstance.updatePostLocationInit(params);
        return { url, ...init };
      },
    }),

    getPostsByLocation: builder.query<
      PostEntity[],
      Parameters<typeof postsApiInstance.getPostsByLocation>[0]
    >({
      query: (params) => {
        const { url, init } = postsApiInstance.getPostsByLocationInit(params);
        return { url, ...init };
      },
    }),

    getRepostsOfPost: builder.query<
      PostEntity[],
      Parameters<typeof postsApiInstance.getRepostsOfPost>[0]
    >({
      query: (params) => {
        const { url, init } = postsApiInstance.getRepostsOfPostInit(params);
        return { url, ...init };
      },
    }),

    getRepliesOfPost: builder.query<
      PostEntity[],
      Parameters<typeof postsApiInstance.getRepliesOfPost>[0]
    >({
      query: (params) => {
        const { url, init } = postsApiInstance.getRepliesOfPostInit(params);
        return { url, ...init };
      },
    }),

    getForwardsOfPost: builder.query<
      PostEntity[],
      Parameters<typeof postsApiInstance.getForwardsOfPost>[0]
    >({
      query: (params) => {
        const { url, init } = postsApiInstance.getForwardsOfPostInit(params);
        return { url, ...init };
      },
    }),

    getAllRelatedPosts: builder.query<
      PostEntity[],
      Parameters<typeof postsApiInstance.getAllRelatedPosts>[0]
    >({
      query: (params) => {
        const { url, init } = postsApiInstance.getAllRelatedPostsInit(params);
        return { url, ...init };
      },
    }),

    getReplyChain: builder.query<
      PostEntity[],
      Parameters<typeof postsApiInstance.getReplyChain>[0]
    >({
      query: (params) => {
        const { url, init } = postsApiInstance.getReplyChainInit(params);
        return { url, ...init };
      },
    }),

    incrementViewCount: builder.mutation<
      PostEntity,
      Parameters<typeof postsApiInstance.incrementViewCount>[0]
    >({
      query: (params) => {
        const { url, init } = postsApiInstance.incrementViewCountInit(params);
        return { url, ...init };
      },
    }),
  }),
});
