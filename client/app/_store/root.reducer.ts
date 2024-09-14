import { combineReducers } from 'redux'
import {
  commentsApi, dialogsApi, mediaApi, messagesApi, postsApi, profileApi, tagsApi, userInfoApi,
} from './api'
import { counterReducer } from './messagesReducer'

export const rootReducer = combineReducers({
  counter: counterReducer,
  [tagsApi.reducerPath]: tagsApi.reducer,
  [commentsApi.reducerPath]: commentsApi.reducer,
  [messagesApi.reducerPath]: messagesApi.reducer,
  [dialogsApi.reducerPath]: dialogsApi.reducer,
  [mediaApi.reducerPath]: mediaApi.reducer,
  [postsApi.reducerPath]: postsApi.reducer,
  [profileApi.reducerPath]: profileApi.reducer,
  [userInfoApi.reducerPath]: userInfoApi.reducer,
})

export type RootReducer = ReturnType<typeof rootReducer>
