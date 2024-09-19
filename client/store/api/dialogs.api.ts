
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { CookieType } from '../../app/types/cookie';
import { RootState, store } from '../store'
import { dialogsApiInstance } from '../../store/instance'
import { CreateDialogDto, PublicationType, UserAbout, MediaMetadata, ReactionEntity, CommentEntity, PostVisibility, PostEntity, Tag, MediaEntity, UserInfo, DialogEntity, MessageEntity, UpdateDialogDto, Object, DialogShortDto } from '../../../swagger/dialogs/interfaces-dialogs'
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

export const dialogsApi = createApi({
  reducerPath: 'API_dialogs',
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
  }),
  endpoints: (builder) => ({
    
    create: builder.mutation<DialogEntity, Parameters<typeof dialogsApiInstance.create>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.createInit(params)
        return { url, ...init }
      },
    }),

    findAll: builder.query<DialogEntity[], Parameters<typeof dialogsApiInstance.findAll>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.findAllInit(params)
        return { url, ...init }
      },
    }),

    findOne: builder.query<DialogEntity, Parameters<typeof dialogsApiInstance.findOne>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.findOneInit(params)
        return { url, ...init }
      },
    }),

    update: builder.mutation<DialogEntity, Parameters<typeof dialogsApiInstance.update>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.updateInit(params)
        return { url, ...init }
      },
    }),

    remove: builder.mutation<any, Parameters<typeof dialogsApiInstance.remove>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.removeInit(params)
        return { url, ...init }
      },
    }),

    addParticipant: builder.mutation<DialogEntity, Parameters<typeof dialogsApiInstance.addParticipant>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.addParticipantInit(params)
        return { url, ...init }
      },
    }),

    removeParticipant: builder.mutation<DialogEntity, Parameters<typeof dialogsApiInstance.removeParticipant>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.removeParticipantInit(params)
        return { url, ...init }
      },
    }),

    addAdmin: builder.mutation<DialogEntity, Parameters<typeof dialogsApiInstance.addAdmin>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.addAdminInit(params)
        return { url, ...init }
      },
    }),

    removeAdmin: builder.mutation<DialogEntity, Parameters<typeof dialogsApiInstance.removeAdmin>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.removeAdminInit(params)
        return { url, ...init }
      },
    }),

    addFixedMessage: builder.mutation<DialogEntity, Parameters<typeof dialogsApiInstance.addFixedMessage>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.addFixedMessageInit(params)
        return { url, ...init }
      },
    }),

    removeFixedMessage: builder.mutation<DialogEntity, Parameters<typeof dialogsApiInstance.removeFixedMessage>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.removeFixedMessageInit(params)
        return { url, ...init }
      },
    }),

    getUnreadMessagesCount: builder.query<number, Parameters<typeof dialogsApiInstance.getUnreadMessagesCount>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.getUnreadMessagesCountInit(params)
        return { url, ...init }
      },
    }),

    markMessagesAsRead: builder.mutation<DialogEntity, Parameters<typeof dialogsApiInstance.markMessagesAsRead>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.markMessagesAsReadInit(params)
        return { url, ...init }
      },
    }),

    getAllMediaForDialog: builder.query<object[], Parameters<typeof dialogsApiInstance.getAllMediaForDialog>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.getAllMediaForDialogInit(params)
        return { url, ...init }
      },
    }),

    updateDialogImage: builder.mutation<DialogEntity, Parameters<typeof dialogsApiInstance.updateDialogImage>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.updateDialogImageInit(params)
        return { url, ...init }
      },
    }),

    updateDialogOptions: builder.mutation<DialogEntity, Parameters<typeof dialogsApiInstance.updateDialogOptions>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.updateDialogOptionsInit(params)
        return { url, ...init }
      },
    }),

    getDialogsByParticipant: builder.query<DialogEntity[], Parameters<typeof dialogsApiInstance.getDialogsByParticipant>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.getDialogsByParticipantInit(params)
        return { url, ...init }
      },
    }),

    getDialogParticipants: builder.query<object[], Parameters<typeof dialogsApiInstance.getDialogParticipants>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.getDialogParticipantsInit(params)
        return { url, ...init }
      },
    }),

    getDialogAdmins: builder.query<object[], Parameters<typeof dialogsApiInstance.getDialogAdmins>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.getDialogAdminsInit(params)
        return { url, ...init }
      },
    }),

    leaveDialog: builder.mutation<any, Parameters<typeof dialogsApiInstance.leaveDialog>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.leaveDialogInit(params)
        return { url, ...init }
      },
    }),

    createVideoConference: builder.mutation<string, Parameters<typeof dialogsApiInstance.createVideoConference>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.createVideoConferenceInit(params)
        return { url, ...init }
      },
    }),

    findAllShortDialogs: builder.query<DialogShortDto[], Parameters<typeof dialogsApiInstance.findAllShortDialogs>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.findAllShortDialogsInit(params)
        return { url, ...init }
      },
    }),

    findOneShortDialog: builder.query<DialogShortDto, Parameters<typeof dialogsApiInstance.findOneShortDialog>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.findOneShortDialogInit(params)
        return { url, ...init }
      },
    }),

    findByUserShortDialog: builder.query<DialogShortDto[], Parameters<typeof dialogsApiInstance.findByUserShortDialog>[0]>({
      query: (params) => {
        const { url, init } = dialogsApiInstance.findByUserShortDialogInit(params)
        return { url, ...init }
      },
    }),
  }),
})

// Типизированные функции-обертки в объекте
export const DialogsApiApi = {
  
  create: (props: Parameters<typeof dialogsApiInstance.create>[0]): Promise<QueryResult<DialogEntity>> =>
    store.dispatch(dialogsApi.endpoints.create.initiate(props)),

  findAll: (props: Parameters<typeof dialogsApiInstance.findAll>[0]): Promise<QueryResult<DialogEntity[]>> =>
    store.dispatch(dialogsApi.endpoints.findAll.initiate(props)),

  findOne: (props: Parameters<typeof dialogsApiInstance.findOne>[0]): Promise<QueryResult<DialogEntity>> =>
    store.dispatch(dialogsApi.endpoints.findOne.initiate(props)),

  update: (props: Parameters<typeof dialogsApiInstance.update>[0]): Promise<QueryResult<DialogEntity>> =>
    store.dispatch(dialogsApi.endpoints.update.initiate(props)),

  remove: (props: Parameters<typeof dialogsApiInstance.remove>[0]): Promise<QueryResult<any>> =>
    store.dispatch(dialogsApi.endpoints.remove.initiate(props)),

  addParticipant: (props: Parameters<typeof dialogsApiInstance.addParticipant>[0]): Promise<QueryResult<DialogEntity>> =>
    store.dispatch(dialogsApi.endpoints.addParticipant.initiate(props)),

  removeParticipant: (props: Parameters<typeof dialogsApiInstance.removeParticipant>[0]): Promise<QueryResult<DialogEntity>> =>
    store.dispatch(dialogsApi.endpoints.removeParticipant.initiate(props)),

  addAdmin: (props: Parameters<typeof dialogsApiInstance.addAdmin>[0]): Promise<QueryResult<DialogEntity>> =>
    store.dispatch(dialogsApi.endpoints.addAdmin.initiate(props)),

  removeAdmin: (props: Parameters<typeof dialogsApiInstance.removeAdmin>[0]): Promise<QueryResult<DialogEntity>> =>
    store.dispatch(dialogsApi.endpoints.removeAdmin.initiate(props)),

  addFixedMessage: (props: Parameters<typeof dialogsApiInstance.addFixedMessage>[0]): Promise<QueryResult<DialogEntity>> =>
    store.dispatch(dialogsApi.endpoints.addFixedMessage.initiate(props)),

  removeFixedMessage: (props: Parameters<typeof dialogsApiInstance.removeFixedMessage>[0]): Promise<QueryResult<DialogEntity>> =>
    store.dispatch(dialogsApi.endpoints.removeFixedMessage.initiate(props)),

  getUnreadMessagesCount: (props: Parameters<typeof dialogsApiInstance.getUnreadMessagesCount>[0]): Promise<QueryResult<number>> =>
    store.dispatch(dialogsApi.endpoints.getUnreadMessagesCount.initiate(props)),

  markMessagesAsRead: (props: Parameters<typeof dialogsApiInstance.markMessagesAsRead>[0]): Promise<QueryResult<DialogEntity>> =>
    store.dispatch(dialogsApi.endpoints.markMessagesAsRead.initiate(props)),

  getAllMediaForDialog: (props: Parameters<typeof dialogsApiInstance.getAllMediaForDialog>[0]): Promise<QueryResult<object[]>> =>
    store.dispatch(dialogsApi.endpoints.getAllMediaForDialog.initiate(props)),

  updateDialogImage: (props: Parameters<typeof dialogsApiInstance.updateDialogImage>[0]): Promise<QueryResult<DialogEntity>> =>
    store.dispatch(dialogsApi.endpoints.updateDialogImage.initiate(props)),

  updateDialogOptions: (props: Parameters<typeof dialogsApiInstance.updateDialogOptions>[0]): Promise<QueryResult<DialogEntity>> =>
    store.dispatch(dialogsApi.endpoints.updateDialogOptions.initiate(props)),

  getDialogsByParticipant: (props: Parameters<typeof dialogsApiInstance.getDialogsByParticipant>[0]): Promise<QueryResult<DialogEntity[]>> =>
    store.dispatch(dialogsApi.endpoints.getDialogsByParticipant.initiate(props)),

  getDialogParticipants: (props: Parameters<typeof dialogsApiInstance.getDialogParticipants>[0]): Promise<QueryResult<object[]>> =>
    store.dispatch(dialogsApi.endpoints.getDialogParticipants.initiate(props)),

  getDialogAdmins: (props: Parameters<typeof dialogsApiInstance.getDialogAdmins>[0]): Promise<QueryResult<object[]>> =>
    store.dispatch(dialogsApi.endpoints.getDialogAdmins.initiate(props)),

  leaveDialog: (props: Parameters<typeof dialogsApiInstance.leaveDialog>[0]): Promise<QueryResult<any>> =>
    store.dispatch(dialogsApi.endpoints.leaveDialog.initiate(props)),

  createVideoConference: (props: Parameters<typeof dialogsApiInstance.createVideoConference>[0]): Promise<QueryResult<string>> =>
    store.dispatch(dialogsApi.endpoints.createVideoConference.initiate(props)),

  findAllShortDialogs: (props: Parameters<typeof dialogsApiInstance.findAllShortDialogs>[0]): Promise<QueryResult<DialogShortDto[]>> =>
    store.dispatch(dialogsApi.endpoints.findAllShortDialogs.initiate(props)),

  findOneShortDialog: (props: Parameters<typeof dialogsApiInstance.findOneShortDialog>[0]): Promise<QueryResult<DialogShortDto>> =>
    store.dispatch(dialogsApi.endpoints.findOneShortDialog.initiate(props)),

  findByUserShortDialog: (props: Parameters<typeof dialogsApiInstance.findByUserShortDialog>[0]): Promise<QueryResult<DialogShortDto[]>> =>
    store.dispatch(dialogsApi.endpoints.findByUserShortDialog.initiate(props))
};

// Экспорт типов для использования в других частях приложения
export type DialogsApiApiType = typeof DialogsApiApi