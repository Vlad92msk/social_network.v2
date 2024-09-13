import { combineReducers } from 'redux'
import { commentsApi } from './api/comments'
import { dialogsApi } from './api/dialogs'
import { mediaApi } from './api/media'
import { messagesApi } from './api/messages'
import { postsApi } from './api/posts'
import { profileApi } from './api/profile'
import { tagsApi } from './api/tags'
import { userInfoApi } from './api/userInfo'
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
