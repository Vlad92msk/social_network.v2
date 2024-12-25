import { configureStore, Middleware } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { merge } from 'lodash'
import logger from 'redux-logger'
import {
  FLUSH, PAUSE, PERSIST, persistStore, PURGE, REGISTER, REHYDRATE,
} from 'redux-persist'
import {
  GET_INIT_STATE, INIT_MESSAGE_LISTENER,
  initMessageListener, RECEIVE_INIT_STATE, SEND_INIT_STATE,
} from 'redux-state-sync'
import { dialogKeyboardEventsMiddleware } from '@ui/modules/messenger/store/dialogKeyboardEventsMiddleware'
import { dialogSocketMiddleware } from '@ui/modules/messenger/store/dialogSocketMiddleware'
import {
  commentsApi, dialogsApi, mediaApi, messagesApi, postsApi, profileApi, reactionsApi, tagsApi, userInfoApi,
} from './api'
import { persistedReducer, rootInitialState, rootReducer, RootReducer } from './root.reducer'
import { stateSyncMiddleware } from './shared-channel.middleware'

export const makeStore = (preloadedState?: Partial<RootReducer>) => {
  const mergedPreloadedState = preloadedState ? merge({}, rootInitialState, preloadedState) : undefined

  const middlewares: Middleware[] = [
    stateSyncMiddleware,
    tagsApi.middleware,
    commentsApi.middleware,
    dialogsApi.middleware,
    mediaApi.middleware,
    messagesApi.middleware,
    postsApi.middleware,
    profileApi.middleware,
    userInfoApi.middleware,
    reactionsApi.middleware,
    dialogSocketMiddleware,
    dialogKeyboardEventsMiddleware,
    // logger,
  ]

  const store = configureStore({
    reducer: rootReducer,
    preloadedState: mergedPreloadedState,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(middlewares),
  })

  // Инициализируем слушатель после создания store
  // initMessageListener(store)

  return store
}

export const store = makeStore()
export const persistor = persistStore(store)
setupListeners(store.dispatch)

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
