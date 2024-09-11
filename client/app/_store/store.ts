import { configureStore } from '@reduxjs/toolkit'
import { rootReducer } from "./reducer";
import { setupListeners } from '@reduxjs/toolkit/query'
import { tagsApiInstance, messagesApiInstance, dialogsApiInstance, postsApiInstance, commentsApiInstance, mediaApiInstance, userInfoApiInstance, profileApiInstance } from "./api/instanse";
import { tagsApi, commentsApi, messagesApi, dialogsApi, mediaApi, postsApi, profileApi, userInfoApi } from "./api/createdApi";
import { createEpicMiddleware } from 'redux-observable';
import { rootEffect } from './effects';

export const ApiService = {
    tags: tagsApiInstance,
    comments: commentsApiInstance,
    messages: messagesApiInstance,
    dialogs: dialogsApiInstance,
    media: mediaApiInstance,
    posts: postsApiInstance,
    profile: profileApiInstance,
    userInfo: userInfoApiInstance,
};

export type ApiServiceType = typeof ApiService;

const effectMiddleware = createEpicMiddleware<any, any, any, ApiServiceType>({
    dependencies: ApiService,
});


export const makeStore = () => {
    const store = configureStore({
        reducer: {
            ...rootReducer,
            [tagsApi.reducerPath]: tagsApi.reducer,
            [commentsApi.reducerPath]: commentsApi.reducer,
            [messagesApi.reducerPath]: messagesApi.reducer,
            [dialogsApi.reducerPath]: dialogsApi.reducer,
            [mediaApi.reducerPath]: mediaApi.reducer,
            [postsApi.reducerPath]: postsApi.reducer,
            [profileApi.reducerPath]: profileApi.reducer,
            [userInfoApi.reducerPath]: userInfoApi.reducer,
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(
                tagsApi.middleware,
                effectMiddleware
            ),
    });

    effectMiddleware.run(rootEffect);

    return store;
}

setupListeners(makeStore().dispatch)

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']

