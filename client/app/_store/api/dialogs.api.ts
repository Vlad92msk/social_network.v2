import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { CookieType } from '../../types/cookie'
import { dialogsApiInstance } from '../../../apiInstance/dialogs.instance'

export const dialogsApi = createApi({
  reducerPath: 'API_dialogs',
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
    create: builder.mutation<
          ReturnType<typeof dialogsApiInstance.create>,
          Parameters<typeof dialogsApiInstance.createInit>[0]
        >({
          // query: dialogsApiInstance.createInit,
          query: (params) => {
            const { url, ...rest } = dialogsApiInstance.createInit(params)
            return ({ url, ...rest })
          },
        }),
    findAll: builder.query<
          ReturnType<typeof dialogsApiInstance.findAll>,
          Parameters<typeof dialogsApiInstance.findAllInit>[0]
        >({
          // query: dialogsApiInstance.findAllInit,
          query: (params) => {
            const { url, ...rest } = dialogsApiInstance.findAllInit(params)
            return ({ url, ...rest })
          },
        }),
    findOne: builder.query<
          ReturnType<typeof dialogsApiInstance.findOne>,
          Parameters<typeof dialogsApiInstance.findOneInit>[0]
        >({
          // query: dialogsApiInstance.findOneInit,
          query: (params) => {
            const { url, ...rest } = dialogsApiInstance.findOneInit(params)
            return ({ url, ...rest })
          },
        }),
    update: builder.mutation<
          ReturnType<typeof dialogsApiInstance.update>,
          Parameters<typeof dialogsApiInstance.updateInit>[0]
        >({
          // query: dialogsApiInstance.updateInit,
          query: (params) => {
            const { url, ...rest } = dialogsApiInstance.updateInit(params)
            return ({ url, ...rest })
          },
        }),
    remove: builder.mutation<
          ReturnType<typeof dialogsApiInstance.remove>,
          Parameters<typeof dialogsApiInstance.removeInit>[0]
        >({
          // query: dialogsApiInstance.removeInit,
          query: (params) => {
            const { url, ...rest } = dialogsApiInstance.removeInit(params)
            return ({ url, ...rest })
          },
        }),
    addParticipant: builder.mutation<
          ReturnType<typeof dialogsApiInstance.addParticipant>,
          Parameters<typeof dialogsApiInstance.addParticipantInit>[0]
        >({
          // query: dialogsApiInstance.addParticipantInit,
          query: (params) => {
            const { url, ...rest } = dialogsApiInstance.addParticipantInit(params)
            return ({ url, ...rest })
          },
        }),
    removeParticipant: builder.mutation<
          ReturnType<typeof dialogsApiInstance.removeParticipant>,
          Parameters<typeof dialogsApiInstance.removeParticipantInit>[0]
        >({
          // query: dialogsApiInstance.removeParticipantInit,
          query: (params) => {
            const { url, ...rest } = dialogsApiInstance.removeParticipantInit(params)
            return ({ url, ...rest })
          },
        }),
    addAdmin: builder.mutation<
          ReturnType<typeof dialogsApiInstance.addAdmin>,
          Parameters<typeof dialogsApiInstance.addAdminInit>[0]
        >({
          // query: dialogsApiInstance.addAdminInit,
          query: (params) => {
            const { url, ...rest } = dialogsApiInstance.addAdminInit(params)
            return ({ url, ...rest })
          },
        }),
    removeAdmin: builder.mutation<
          ReturnType<typeof dialogsApiInstance.removeAdmin>,
          Parameters<typeof dialogsApiInstance.removeAdminInit>[0]
        >({
          // query: dialogsApiInstance.removeAdminInit,
          query: (params) => {
            const { url, ...rest } = dialogsApiInstance.removeAdminInit(params)
            return ({ url, ...rest })
          },
        }),
    addFixedMessage: builder.mutation<
          ReturnType<typeof dialogsApiInstance.addFixedMessage>,
          Parameters<typeof dialogsApiInstance.addFixedMessageInit>[0]
        >({
          // query: dialogsApiInstance.addFixedMessageInit,
          query: (params) => {
            const { url, ...rest } = dialogsApiInstance.addFixedMessageInit(params)
            return ({ url, ...rest })
          },
        }),
    removeFixedMessage: builder.mutation<
          ReturnType<typeof dialogsApiInstance.removeFixedMessage>,
          Parameters<typeof dialogsApiInstance.removeFixedMessageInit>[0]
        >({
          // query: dialogsApiInstance.removeFixedMessageInit,
          query: (params) => {
            const { url, ...rest } = dialogsApiInstance.removeFixedMessageInit(params)
            return ({ url, ...rest })
          },
        }),
    getUnreadMessagesCount: builder.query<
          ReturnType<typeof dialogsApiInstance.getUnreadMessagesCount>,
          Parameters<typeof dialogsApiInstance.getUnreadMessagesCountInit>[0]
        >({
          // query: dialogsApiInstance.getUnreadMessagesCountInit,
          query: (params) => {
            const { url, ...rest } = dialogsApiInstance.getUnreadMessagesCountInit(params)
            return ({ url, ...rest })
          },
        }),
    markMessagesAsRead: builder.mutation<
          ReturnType<typeof dialogsApiInstance.markMessagesAsRead>,
          Parameters<typeof dialogsApiInstance.markMessagesAsReadInit>[0]
        >({
          // query: dialogsApiInstance.markMessagesAsReadInit,
          query: (params) => {
            const { url, ...rest } = dialogsApiInstance.markMessagesAsReadInit(params)
            return ({ url, ...rest })
          },
        }),
    getAllMediaForDialog: builder.query<
          ReturnType<typeof dialogsApiInstance.getAllMediaForDialog>,
          Parameters<typeof dialogsApiInstance.getAllMediaForDialogInit>[0]
        >({
          // query: dialogsApiInstance.getAllMediaForDialogInit,
          query: (params) => {
            const { url, ...rest } = dialogsApiInstance.getAllMediaForDialogInit(params)
            return ({ url, ...rest })
          },
        }),
    updateDialogImage: builder.mutation<
          ReturnType<typeof dialogsApiInstance.updateDialogImage>,
          Parameters<typeof dialogsApiInstance.updateDialogImageInit>[0]
        >({
          // query: dialogsApiInstance.updateDialogImageInit,
          query: (params) => {
            const { url, ...rest } = dialogsApiInstance.updateDialogImageInit(params)
            return ({ url, ...rest })
          },
        }),
    updateDialogOptions: builder.mutation<
          ReturnType<typeof dialogsApiInstance.updateDialogOptions>,
          Parameters<typeof dialogsApiInstance.updateDialogOptionsInit>[0]
        >({
          // query: dialogsApiInstance.updateDialogOptionsInit,
          query: (params) => {
            const { url, ...rest } = dialogsApiInstance.updateDialogOptionsInit(params)
            return ({ url, ...rest })
          },
        }),
    getDialogsByParticipant: builder.query<
          ReturnType<typeof dialogsApiInstance.getDialogsByParticipant>,
          Parameters<typeof dialogsApiInstance.getDialogsByParticipantInit>[0]
        >({
          // query: dialogsApiInstance.getDialogsByParticipantInit,
          query: (params) => {
            const { url, ...rest } = dialogsApiInstance.getDialogsByParticipantInit(params)
            return ({ url, ...rest })
          },
        }),
    getDialogParticipants: builder.query<
          ReturnType<typeof dialogsApiInstance.getDialogParticipants>,
          Parameters<typeof dialogsApiInstance.getDialogParticipantsInit>[0]
        >({
          // query: dialogsApiInstance.getDialogParticipantsInit,
          query: (params) => {
            const { url, ...rest } = dialogsApiInstance.getDialogParticipantsInit(params)
            return ({ url, ...rest })
          },
        }),
    getDialogAdmins: builder.query<
          ReturnType<typeof dialogsApiInstance.getDialogAdmins>,
          Parameters<typeof dialogsApiInstance.getDialogAdminsInit>[0]
        >({
          // query: dialogsApiInstance.getDialogAdminsInit,
          query: (params) => {
            const { url, ...rest } = dialogsApiInstance.getDialogAdminsInit(params)
            return ({ url, ...rest })
          },
        }),
    leaveDialog: builder.mutation<
          ReturnType<typeof dialogsApiInstance.leaveDialog>,
          Parameters<typeof dialogsApiInstance.leaveDialogInit>[0]
        >({
          // query: dialogsApiInstance.leaveDialogInit,
          query: (params) => {
            const { url, ...rest } = dialogsApiInstance.leaveDialogInit(params)
            return ({ url, ...rest })
          },
        }),
    createVideoConference: builder.mutation<
          ReturnType<typeof dialogsApiInstance.createVideoConference>,
          Parameters<typeof dialogsApiInstance.createVideoConferenceInit>[0]
        >({
          // query: dialogsApiInstance.createVideoConferenceInit,
          query: (params) => {
            const { url, ...rest } = dialogsApiInstance.createVideoConferenceInit(params)
            return ({ url, ...rest })
          },
        }),
    findAllShortDialogs: builder.query<
          ReturnType<typeof dialogsApiInstance.findAllShortDialogs>,
          Parameters<typeof dialogsApiInstance.findAllShortDialogsInit>[0]
        >({
          // query: dialogsApiInstance.findAllShortDialogsInit,
          query: (params) => {
            const { url, ...rest } = dialogsApiInstance.findAllShortDialogsInit(params)
            return ({ url, ...rest })
          },
        }),
    findOneShortDialog: builder.query<
          ReturnType<typeof dialogsApiInstance.findOneShortDialog>,
          Parameters<typeof dialogsApiInstance.findOneShortDialogInit>[0]
        >({
          // query: dialogsApiInstance.findOneShortDialogInit,
          query: (params) => {
            const { url, ...rest } = dialogsApiInstance.findOneShortDialogInit(params)
            return ({ url, ...rest })
          },
        }),
    findByUserShortDialog: builder.query<
          ReturnType<typeof dialogsApiInstance.findByUserShortDialog>,
          Parameters<typeof dialogsApiInstance.findByUserShortDialogInit>[0]
        >({
          // query: dialogsApiInstance.findByUserShortDialogInit,
          query: (params) => {
            const { url, ...rest } = dialogsApiInstance.findByUserShortDialogInit(params)
            return ({ url, ...rest })
          },
        }),
  }),
})
