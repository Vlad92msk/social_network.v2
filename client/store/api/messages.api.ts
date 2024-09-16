
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { CookieType } from '../../app/types/cookie';
import { RootState } from '../store'
import { messagesApiInstance } from '../../store/instance';
import { CreateMessageDto, PublicationType, UserAbout, MediaMetadata, DialogEntity, MessageEntity, ReactionEntity, CommentEntity, PostVisibility, PostEntity, Tag, MediaEntity, UserInfo, UpdateMessageDto } from '../../../swagger/messages/interfaces-messages';

export const messagesApi = createApi({
  reducerPath: 'API_messages',
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
      MessageEntity,
      Parameters<typeof messagesApiInstance.create>[0]
    >({
      query: (params) => {
        const { url, init } = messagesApiInstance.createInit(params);
        return { url, ...init };
      },
    }),

    findAll: builder.query<
      MessageEntity[],
      Parameters<typeof messagesApiInstance.findAll>[0]
    >({
      query: (params) => {
        const { url, init } = messagesApiInstance.findAllInit(params);
        return { url, ...init };
      },
    }),

    findOne: builder.query<
      MessageEntity,
      Parameters<typeof messagesApiInstance.findOne>[0]
    >({
      query: (params) => {
        const { url, init } = messagesApiInstance.findOneInit(params);
        return { url, ...init };
      },
    }),

    update: builder.mutation<
      MessageEntity,
      Parameters<typeof messagesApiInstance.update>[0]
    >({
      query: (params) => {
        const { url, init } = messagesApiInstance.updateInit(params);
        return { url, ...init };
      },
    }),

    remove: builder.mutation<
      any,
      Parameters<typeof messagesApiInstance.remove>[0]
    >({
      query: (params) => {
        const { url, init } = messagesApiInstance.removeInit(params);
        return { url, ...init };
      },
    }),

    markAsDelivered: builder.mutation<
      MessageEntity,
      Parameters<typeof messagesApiInstance.markAsDelivered>[0]
    >({
      query: (params) => {
        const { url, init } = messagesApiInstance.markAsDeliveredInit(params);
        return { url, ...init };
      },
    }),

    markAsRead: builder.mutation<
      MessageEntity,
      Parameters<typeof messagesApiInstance.markAsRead>[0]
    >({
      query: (params) => {
        const { url, init } = messagesApiInstance.markAsReadInit(params);
        return { url, ...init };
      },
    }),

    forwardMessage: builder.mutation<
      MessageEntity,
      Parameters<typeof messagesApiInstance.forwardMessage>[0]
    >({
      query: (params) => {
        const { url, init } = messagesApiInstance.forwardMessageInit(params);
        return { url, ...init };
      },
    }),

    replyToMessage: builder.mutation<
      MessageEntity,
      Parameters<typeof messagesApiInstance.replyToMessage>[0]
    >({
      query: (params) => {
        const { url, init } = messagesApiInstance.replyToMessageInit(params);
        return { url, ...init };
      },
    }),

    getAllMediaForMessage: builder.query<
      any,
      Parameters<typeof messagesApiInstance.getAllMediaForMessage>[0]
    >({
      query: (params) => {
        const { url, init } = messagesApiInstance.getAllMediaForMessageInit(params);
        return { url, ...init };
      },
    }),

    getReplyChain: builder.query<
      MessageEntity[],
      Parameters<typeof messagesApiInstance.getReplyChain>[0]
    >({
      query: (params) => {
        const { url, init } = messagesApiInstance.getReplyChainInit(params);
        return { url, ...init };
      },
    }),

    addReaction: builder.mutation<
      any,
      Parameters<typeof messagesApiInstance.addReaction>[0]
    >({
      query: (params) => {
        const { url, init } = messagesApiInstance.addReactionInit(params);
        return { url, ...init };
      },
    }),

    getReactions: builder.query<
      any,
      Parameters<typeof messagesApiInstance.getReactions>[0]
    >({
      query: (params) => {
        const { url, init } = messagesApiInstance.getReactionsInit(params);
        return { url, ...init };
      },
    }),

    removeReaction: builder.mutation<
      any,
      Parameters<typeof messagesApiInstance.removeReaction>[0]
    >({
      query: (params) => {
        const { url, init } = messagesApiInstance.removeReactionInit(params);
        return { url, ...init };
      },
    }),

    fullTextSearch: builder.mutation<
      MessageEntity[],
      Parameters<typeof messagesApiInstance.fullTextSearch>[0]
    >({
      query: (params) => {
        const { url, init } = messagesApiInstance.fullTextSearchInit(params);
        return { url, ...init };
      },
    }),

    getReactionCount: builder.query<
      any,
      Parameters<typeof messagesApiInstance.getReactionCount>[0]
    >({
      query: (params) => {
        const { url, init } = messagesApiInstance.getReactionCountInit(params);
        return { url, ...init };
      },
    }),

    hasUserReacted: builder.mutation<
      any,
      Parameters<typeof messagesApiInstance.hasUserReacted>[0]
    >({
      query: (params) => {
        const { url, init } = messagesApiInstance.hasUserReactedInit(params);
        return { url, ...init };
      },
    }),

    createTemporaryMessage: builder.mutation<
      MessageEntity,
      Parameters<typeof messagesApiInstance.createTemporaryMessage>[0]
    >({
      query: (params) => {
        const { url, init } = messagesApiInstance.createTemporaryMessageInit(params);
        return { url, ...init };
      },
    }),
  }),
});
