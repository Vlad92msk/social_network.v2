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
import { persistedReducer, rootInitialState, RootReducer } from './root.reducer'
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
    reducer: persistedReducer,
    preloadedState: mergedPreloadedState,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
      // Важно отключить сериализацию для корректной работы с IndexedDB
      serializableCheck: {
        ignoredActions: [
          // Существующие actions для redux-state-sync и redux-persist
          GET_INIT_STATE, SEND_INIT_STATE, RECEIVE_INIT_STATE, INIT_MESSAGE_LISTENER,
          FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER,

          // Добавляем actions для RTK Query
          `${tagsApi.reducerPath}/executeQuery/fulfilled`,
          `${commentsApi.reducerPath}/executeQuery/fulfilled`,
          `${dialogsApi.reducerPath}/executeQuery/fulfilled`,
          `${mediaApi.reducerPath}/executeQuery/fulfilled`,
          `${messagesApi.reducerPath}/executeQuery/fulfilled`,
          `${postsApi.reducerPath}/executeQuery/fulfilled`,
          `${profileApi.reducerPath}/executeQuery/fulfilled`,
          `${userInfoApi.reducerPath}/executeQuery/fulfilled`,
          `${reactionsApi.reducerPath}/executeQuery/fulfilled`,
        ],
      },
    }).concat(middlewares),
  })

  // Инициализируем слушатель после создания store
  initMessageListener(store)

  return store
}

export const store = makeStore()
export const persistor = persistStore(store)
setupListeners(store.dispatch)

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
