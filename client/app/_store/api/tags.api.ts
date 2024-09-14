import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { CookieType } from '../../types/cookie'
import { tagsApiInstance } from '../../../apiInstance'

export const tagsApi = createApi({
  reducerPath: 'API_tags',
  baseQuery: fetchBaseQuery({
    prepareHeaders: (headers, { getState }) => {
      const state = getState()
      // @ts-ignore
      const profileId = state.profile.id
      // @ts-ignore
      const userInfoId = state.profile.user_info.id

      headers.set(CookieType.USER_PROFILE_ID, String(profileId));
      headers.set(CookieType.USER_INFO_ID, String(userInfoId));
      return headers;
    },
  }),
  endpoints: (builder) => ({
    createTag: builder.mutation<
            ReturnType<typeof tagsApiInstance.createTag>,
            Parameters<typeof tagsApiInstance.createTagInit>[0]
        >({
          query: (params) => {
            const { url, ...rest } = tagsApiInstance.createTagInit(params)
            return ({ url, ...rest })
          },
        }),
    findTags: builder.query<
            ReturnType<typeof tagsApiInstance.findTags>,
            Parameters<typeof tagsApiInstance.findTagsInit>[0]
        >({
          query: (params) => {
            const { url, ...rest } = tagsApiInstance.findTagsInit(params)
            return ({ url, ...rest })
          },
        }),
    findTagById: builder.query<
            ReturnType<typeof tagsApiInstance.findTagById>,
            Parameters<typeof tagsApiInstance.findTagByIdInit>[0]
        >({
          query: (params) => {
            const { url, ...rest } = tagsApiInstance.findTagByIdInit(params)
            return ({ url, ...rest })
          },
        }),
    updateTag: builder.mutation<
            ReturnType<typeof tagsApiInstance.updateTag>,
            Parameters<typeof tagsApiInstance.updateTagInit>[0]
        >({
          query: (params) => {
            const { url, ...rest } = tagsApiInstance.updateTagInit(params)
            return ({ url, ...rest })
          },
        }),
    deleteTag: builder.mutation<
            ReturnType<typeof tagsApiInstance.deleteTag>,
            Parameters<typeof tagsApiInstance.deleteTagInit>[0]
        >({
          query: (params) => {
            const { url, ...rest } = tagsApiInstance.deleteTagInit(params)
            return ({ url, ...rest })
          },
        }),
    findTagsByIds: builder.query<
            ReturnType<typeof tagsApiInstance.findTagsByIds>,
            Parameters<typeof tagsApiInstance.findTagsByIdsInit>[0]
        >({
          query: (params) => {
            const { url, ...rest } = tagsApiInstance.findTagsByIdsInit(params)
            return ({ url, ...rest })
          },
        }),
  }),
})
