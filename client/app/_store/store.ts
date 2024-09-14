import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import logger from 'redux-logger'
import { createEpicMiddleware } from 'redux-observable'
import {
  commentsApi, dialogsApi, mediaApi, messagesApi, postsApi, profileApi, tagsApi, userInfoApi,
} from './api'
import { rootEffect } from './root.effects'
import { RootReducer, rootReducer } from './root.reducer'
import {
  commentsApiInstance,
  dialogsApiInstance,
  mediaApiInstance,
  messagesApiInstance,
  postsApiInstance,
  profileApiInstance,
  tagsApiInstance,
  userInfoApiInstance,
} from '../../apiInstance'

export const ApiService = {
  tags: tagsApiInstance,
  comments: commentsApiInstance,
  messages: messagesApiInstance,
  dialogs: dialogsApiInstance,
  media: mediaApiInstance,
  posts: postsApiInstance,
  profile: profileApiInstance,
  userInfo: userInfoApiInstance,
}

export type ApiServiceType = typeof ApiService

export const makeStore = (preloadedState?: Partial<RootReducer>) => {
  const effectMiddleware = createEpicMiddleware<any, any, RootReducer, ApiServiceType>({
    dependencies: ApiService,
  })

  const store = configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(
      tagsApi.middleware,
      commentsApi.middleware,
      dialogsApi.middleware,
      mediaApi.middleware,
      messagesApi.middleware,
      postsApi.middleware,
      profileApi.middleware,
      userInfoApi.middleware,
      effectMiddleware,
      logger,
    ),
  })

  effectMiddleware.run(rootEffect)

  return store
}

setupListeners(makeStore().dispatch)

export type AppStore = ReturnType<typeof makeStore>
export type RootStore = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
