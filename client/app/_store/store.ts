import { configureStore } from '@reduxjs/toolkit'
import { rootReducer } from "./reducer";
import { setupListeners } from '@reduxjs/toolkit/query'
import { enhancedApi as postsApi } from './generated/postsApi'
import { enhancedApi as profileApi } from './generated/profileApi'
import { enhancedApi as userInfoApi } from './generated/user-infoApi'
const apis = [postsApi, profileApi, userInfoApi] as const;

export const store = configureStore({
    reducer: {
        ...rootReducer,
        ...Object.fromEntries(
            apis.map(api => [api.reducerPath, api.reducer])
        ),
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(
            ...apis.map(api => api.middleware)
        ),
})

setupListeners(store.dispatch)

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
