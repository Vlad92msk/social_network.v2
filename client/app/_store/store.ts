import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import logger from 'redux-logger'
import { createEpicMiddleware } from 'redux-observable'
import { commentsApiInstance, commentsApi } from './api/comments'
import { dialogsApiInstance, dialogsApi } from './api/dialogs'
import { mediaApiInstance, mediaApi } from './api/media'
import { messagesApiInstance, messagesApi } from './api/messages'
import { postsApiInstance, postsApi } from './api/posts'
import { profileApiInstance, profileApi } from './api/profile'
import { tagsApi, tagsApiInstance } from './api/tags'
import { userInfoApiInstance, userInfoApi } from './api/userInfo'
import { rootEffect } from './root.effects'
import { RootReducer, rootReducer } from './root.reducer'

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

const effectMiddleware = createEpicMiddleware<any, any, RootReducer, ApiServiceType>({
  dependencies: ApiService,
})

export const makeStore = () => {
  const store = configureStore({
    reducer: rootReducer,
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
