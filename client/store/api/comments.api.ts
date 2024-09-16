
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { CookieType } from '../../app/types/cookie';
import { RootState } from '../store'
import { commentsApiInstance } from '../../store/instance';
import { CreateCommentDto, PublicationType, UserAbout, MediaMetadata, DialogEntity, MessageEntity, ReactionEntity, CommentEntity, PostVisibility, PostEntity, Tag, MediaEntity, UserInfo, UpdateCommentDto, CommentWithChildCountDto, CommentResponseDto } from '../../../swagger/comments/interfaces-comments';

export const commentsApi = createApi({
  reducerPath: 'API_comments',
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
      CommentEntity,
      Parameters<typeof commentsApiInstance.create>[0]
    >({
      query: (params) => {
        const { url, init } = commentsApiInstance.createInit(params);
        return { url, ...init };
      },
    }),

    findAll: builder.query<
      CommentEntity[],
      Parameters<typeof commentsApiInstance.findAll>[0]
    >({
      query: (params) => {
        const { url, init } = commentsApiInstance.findAllInit(params);
        return { url, ...init };
      },
    }),

    update: builder.mutation<
      CommentEntity,
      Parameters<typeof commentsApiInstance.update>[0]
    >({
      query: (params) => {
        const { url, init } = commentsApiInstance.updateInit(params);
        return { url, ...init };
      },
    }),

    findOne: builder.query<
      CommentEntity,
      Parameters<typeof commentsApiInstance.findOne>[0]
    >({
      query: (params) => {
        const { url, init } = commentsApiInstance.findOneInit(params);
        return { url, ...init };
      },
    }),

    remove: builder.mutation<
      any,
      Parameters<typeof commentsApiInstance.remove>[0]
    >({
      query: (params) => {
        const { url, init } = commentsApiInstance.removeInit(params);
        return { url, ...init };
      },
    }),

    findCommentsByPost: builder.query<
      CommentResponseDto,
      Parameters<typeof commentsApiInstance.findCommentsByPost>[0]
    >({
      query: (params) => {
        const { url, init } = commentsApiInstance.findCommentsByPostInit(params);
        return { url, ...init };
      },
    }),

    findCommentsByMedia: builder.query<
      CommentResponseDto,
      Parameters<typeof commentsApiInstance.findCommentsByMedia>[0]
    >({
      query: (params) => {
        const { url, init } = commentsApiInstance.findCommentsByMediaInit(params);
        return { url, ...init };
      },
    }),

    getChildComments: builder.query<
      CommentEntity[],
      Parameters<typeof commentsApiInstance.getChildComments>[0]
    >({
      query: (params) => {
        const { url, init } = commentsApiInstance.getChildCommentsInit(params);
        return { url, ...init };
      },
    }),

    pinComment: builder.mutation<
      CommentEntity,
      Parameters<typeof commentsApiInstance.pinComment>[0]
    >({
      query: (params) => {
        const { url, init } = commentsApiInstance.pinCommentInit(params);
        return { url, ...init };
      },
    }),

    findPinnedComments: builder.query<
      CommentEntity[],
      Parameters<typeof commentsApiInstance.findPinnedComments>[0]
    >({
      query: (params) => {
        const { url, init } = commentsApiInstance.findPinnedCommentsInit(params);
        return { url, ...init };
      },
    }),
  }),
});
