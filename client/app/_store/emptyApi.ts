import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const postsApi = new PostsApi({ baseUrl: 'https://localhost/', someProps: 'someProps' })
const responsePosts = await fetch(postsApi.getPosts({
    ids: [1,2,3,4,5],
}, {
    cache: 'no-cache',
    headers: {
        'content-type': 'application/json',
    }
}));

export const emptySplitApi = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl: '/',
        // prepareHeaders: (headers, { getState }) => {
        //     // Добавляем токен авторизации к каждому запросу
        //     // @ts-ignore
        //     const token = (getState()).auth.token
        //     if (token) {
        //         headers.set('authorization', `Bearer ${token}`)
        //     }
        //     // Добавляем кастомный заголовок
        //     headers.set('Custom-Global-Header', 'Some Value')
        //     return headers
        // },
    }),
    endpoints: (builder) => ({
        getAllPosts: builder.query({
            query: postsApi.getPosts,
        }),
})
