import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { merge } from 'lodash'
import logger from 'redux-logger'
import { dialogKeyboardEventsMiddleware } from '@ui/modules/messenger/store/dialogKeyboardEventsMiddleware'
import { dialogSocketMiddleware } from '@ui/modules/messenger/store/dialogSocketMiddleware'
import {
  commentsApi, dialogsApi, mediaApi, messagesApi, postsApi, profileApi, reactionsApi, tagsApi, userInfoApi,
} from './api'
import { rootInitialState, RootReducer, rootReducer } from './root.reducer'

export const makeStore = (preloadedState?: Partial<RootReducer>) => {
  const mergedPreloadedState = preloadedState ? merge({}, rootInitialState, preloadedState) : undefined

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
      userInfoApi.middleware,
      reactionsApi.middleware,
      dialogSocketMiddleware,
      dialogKeyboardEventsMiddleware,
      // logger,
    ),
  })

  return store
}

export const store = makeStore()
setupListeners(store.dispatch)

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
