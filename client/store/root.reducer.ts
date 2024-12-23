import { combineReducers } from '@reduxjs/toolkit'
import localforage from 'localforage'
import { persistReducer } from 'redux-persist'
import { conferenceReducer, ConferenceSliceState } from '@ui/modules/conference/store/conference.slice'
import { messengerReducer, MessengerSliceState } from '@ui/modules/messenger/store/messenger.slice'
import {
  commentsApi, dialogsApi, mediaApi, messagesApi, postsApi, profileApi, reactionsApi, tagsApi, userInfoApi,
} from './api'
import { profileInitialState, profileReducer, ProfileSliceState } from './profile.slice'

export interface RootReducer {
  profile: ProfileSliceState
  messenger: MessengerSliceState
  conference: ConferenceSliceState
  [tagsApi.reducerPath]: ReturnType<typeof tagsApi.reducer>
  [commentsApi.reducerPath]: ReturnType<typeof commentsApi.reducer>
  [messagesApi.reducerPath]: ReturnType<typeof messagesApi.reducer>
  [dialogsApi.reducerPath]: ReturnType<typeof dialogsApi.reducer>
  [mediaApi.reducerPath]: ReturnType<typeof mediaApi.reducer>
  [postsApi.reducerPath]: ReturnType<typeof postsApi.reducer>
  [profileApi.reducerPath]: ReturnType<typeof profileApi.reducer>
  [userInfoApi.reducerPath]: ReturnType<typeof userInfoApi.reducer>
  [reactionsApi.reducerPath]: ReturnType<typeof reactionsApi.reducer>
}

export const rootReducer = combineReducers({
  profile: profileReducer,
  messenger: messengerReducer,
  conference: conferenceReducer,
  [tagsApi.reducerPath]: tagsApi.reducer,
  [commentsApi.reducerPath]: commentsApi.reducer,
  [messagesApi.reducerPath]: messagesApi.reducer,
  [dialogsApi.reducerPath]: dialogsApi.reducer,
  [mediaApi.reducerPath]: mediaApi.reducer,
  [postsApi.reducerPath]: postsApi.reducer,
  [profileApi.reducerPath]: profileApi.reducer,
  [userInfoApi.reducerPath]: userInfoApi.reducer,
  [reactionsApi.reducerPath]: reactionsApi.reducer,
})

export const rootInitialState: Partial<RootReducer> = {
  profile: profileInitialState,
}

// Оборачиваем корневой reducer
export const persistedReducer = persistReducer({
  key: 'root',
  storage: localforage,
  blacklist: ['conference', 'profile'],
  // Указываем, какие reducers хотим сохранять
  whitelist: [
    tagsApi.reducerPath,
    commentsApi.reducerPath,
    messagesApi.reducerPath,
    dialogsApi.reducerPath,
    mediaApi.reducerPath,
    postsApi.reducerPath,
    profileApi.reducerPath,
    userInfoApi.reducerPath,
    reactionsApi.reducerPath,
  ],
}, rootReducer)
