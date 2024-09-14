import { combineReducers } from 'redux'
import {
  commentsApi, dialogsApi, mediaApi, messagesApi, postsApi, profileApi, tagsApi, userInfoApi,
} from './api'
import { profileReducer } from './profile.slice'

export const rootReducer = combineReducers({
  profile: profileReducer,
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
