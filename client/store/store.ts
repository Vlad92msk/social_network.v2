import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { merge } from 'lodash'
import logger from 'redux-logger'
import { createEpicMiddleware } from 'redux-observable'
import {
  commentsApi, dialogsApi, mediaApi, messagesApi, postsApi, profileApi, tagsApi, userInfoApi,
} from './api'
import {
  commentsApiInstance,
  dialogsApiInstance,
  mediaApiInstance,
  messagesApiInstance,
  postsApiInstance,
  profileApiInstance,
  tagsApiInstance,
  userInfoApiInstance,
} from './instance'
import { rootEffect } from './root.effects'
import { rootInitialState, RootReducer, rootReducer } from './root.reducer'

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
  const mergedPreloadedState = preloadedState ? merge({}, rootInitialState, preloadedState) : undefined

  const effectMiddleware = createEpicMiddleware<any, any, RootReducer, ApiServiceType>({
    dependencies: ApiService,
  })

  const store = configureStore({
    reducer: rootReducer,
    preloadedState: mergedPreloadedState,
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

export const store = makeStore()
setupListeners(store.dispatch)

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
