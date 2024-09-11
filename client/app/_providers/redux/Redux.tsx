'use client'

import { Provider } from 'react-redux'
import { makeStore, AppStore } from "../../_store/store"
import { PropsWithChildren, useRef } from "react"

export const Redux = (props: PropsWithChildren) => {
        const storeRef = useRef<AppStore>(null)
        if (!storeRef.current) {
                // Create the store instance the first time this renders
                storeRef.current = makeStore()
        }

        return <Provider store={storeRef.current}>{props.children}</Provider>
}
