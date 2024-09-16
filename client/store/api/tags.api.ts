
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { CookieType } from '../../app/types/cookie';
import { RootState } from '../store'
import { tagsApiInstance } from '../../store/instance';
import { CreateTagDto, MediaMetadata, UserAbout, PublicationType, Tag, PostVisibility, PostEntity, CommentEntity, DialogEntity, MessageEntity, ReactionEntity, UserInfo, MediaEntity, UpdateTagDto } from '../../../swagger/tags/interfaces-tags';

export const tagsApi = createApi({
  reducerPath: 'API_tags',
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
    
    createTag: builder.mutation<
      Tag,
      Parameters<typeof tagsApiInstance.createTag>[0]
    >({
      query: (params) => {
        const { url, init } = tagsApiInstance.createTagInit(params);
        return { url, ...init };
      },
    }),

    findTags: builder.query<
      Tag[],
      Parameters<typeof tagsApiInstance.findTags>[0]
    >({
      query: (params) => {
        const { url, init } = tagsApiInstance.findTagsInit(params);
        return { url, ...init };
      },
    }),

    findTagById: builder.query<
      Tag,
      Parameters<typeof tagsApiInstance.findTagById>[0]
    >({
      query: (params) => {
        const { url, init } = tagsApiInstance.findTagByIdInit(params);
        return { url, ...init };
      },
    }),

    updateTag: builder.mutation<
      Tag,
      Parameters<typeof tagsApiInstance.updateTag>[0]
    >({
      query: (params) => {
        const { url, init } = tagsApiInstance.updateTagInit(params);
        return { url, ...init };
      },
    }),

    deleteTag: builder.mutation<
      any,
      Parameters<typeof tagsApiInstance.deleteTag>[0]
    >({
      query: (params) => {
        const { url, init } = tagsApiInstance.deleteTagInit(params);
        return { url, ...init };
      },
    }),

    findTagsByIds: builder.query<
      Tag[],
      Parameters<typeof tagsApiInstance.findTagsByIds>[0]
    >({
      query: (params) => {
        const { url, init } = tagsApiInstance.findTagsByIdsInit(params);
        return { url, ...init };
      },
    }),
  }),
});
