import { combineReducers } from '@reduxjs/toolkit'
import {
  commentsApi, dialogsApi, mediaApi, messagesApi, postsApi, profileApi, tagsApi, userInfoApi,
} from './api'
import { profileInitialState, profileReducer, ProfileSliceState } from './profile.slice'

export interface RootReducer {
  profile: ProfileSliceState
  [tagsApi.reducerPath]: ReturnType<typeof tagsApi.reducer>
  [commentsApi.reducerPath]: ReturnType<typeof commentsApi.reducer>
  [messagesApi.reducerPath]: ReturnType<typeof messagesApi.reducer>
  [dialogsApi.reducerPath]: ReturnType<typeof dialogsApi.reducer>
  [mediaApi.reducerPath]: ReturnType<typeof mediaApi.reducer>
  [postsApi.reducerPath]: ReturnType<typeof postsApi.reducer>
  [profileApi.reducerPath]: ReturnType<typeof profileApi.reducer>
  [userInfoApi.reducerPath]: ReturnType<typeof userInfoApi.reducer>
}

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

export const rootInitialState: Partial<RootReducer> = {
  profile: profileInitialState,
}
