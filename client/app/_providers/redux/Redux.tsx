'use client'

import { Provider } from 'react-redux'
import { store } from "../../_store/store"
import { PropsWithChildren } from "react"

export const Redux = (props: PropsWithChildren) => (
    <Provider store={store}>
            {props.children}
        </Provider>
)
