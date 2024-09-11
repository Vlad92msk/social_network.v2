import { configureStore } from '@reduxjs/toolkit'
import { rootReducer } from "./reducer";
import { setupListeners } from '@reduxjs/toolkit/query'
import { tagsApi, tagsApiInstance } from "./generated";
import { createEpicMiddleware } from 'redux-observable';
import { rootEffect } from './effects';

export const ApiService = {
    tags: tagsApiInstance,
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

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']

