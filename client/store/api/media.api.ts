
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { CookieType } from '../../app/types/cookie';
import { RootState } from '../store'
import { mediaApiInstance } from '../../store/instance';
import { MediaMetadata, UserAbout, PublicationType, DialogEntity, MessageEntity, ReactionEntity, CommentEntity, PostVisibility, PostEntity, Tag, MediaEntity, UserInfo } from '../../../swagger/media/interfaces-media';

export const mediaApi = createApi({
  reducerPath: 'API_media',
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
    
    uploadFiles: builder.mutation<
      MediaEntity[],
      Parameters<typeof mediaApiInstance.uploadFiles>[0]
    >({
      query: (params) => {
        const { url, init } = mediaApiInstance.uploadFilesInit(params);
        return { url, ...init };
      },
    }),

    downLoadFile: builder.mutation<
      any,
      Parameters<typeof mediaApiInstance.downLoadFile>[0]
    >({
      query: (params) => {
        const { url, init } = mediaApiInstance.downLoadFileInit(params);
        return { url, ...init };
      },
    }),

    deleteFile: builder.mutation<
      any,
      Parameters<typeof mediaApiInstance.deleteFile>[0]
    >({
      query: (params) => {
        const { url, init } = mediaApiInstance.deleteFileInit(params);
        return { url, ...init };
      },
    }),

    getFiles: builder.query<
      MediaEntity[],
      Parameters<typeof mediaApiInstance.getFiles>[0]
    >({
      query: (params) => {
        const { url, init } = mediaApiInstance.getFilesInit(params);
        return { url, ...init };
      },
    }),

    addTagsToMedia: builder.mutation<
      MediaEntity,
      Parameters<typeof mediaApiInstance.addTagsToMedia>[0]
    >({
      query: (params) => {
        const { url, init } = mediaApiInstance.addTagsToMediaInit(params);
        return { url, ...init };
      },
    }),

    removeTagsFromMedia: builder.mutation<
      MediaEntity,
      Parameters<typeof mediaApiInstance.removeTagsFromMedia>[0]
    >({
      query: (params) => {
        const { url, init } = mediaApiInstance.removeTagsFromMediaInit(params);
        return { url, ...init };
      },
    }),

    getMediaTags: builder.query<
      Tag[],
      Parameters<typeof mediaApiInstance.getMediaTags>[0]
    >({
      query: (params) => {
        const { url, init } = mediaApiInstance.getMediaTagsInit(params);
        return { url, ...init };
      },
    }),
  }),
});
