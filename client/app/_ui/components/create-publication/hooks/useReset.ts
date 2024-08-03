import { useEffect } from 'react'
import { setImmutable } from '@utils/others'
import { useCreatePublicationCtxSelect, useCreatePublicationCtxUpdate } from '../CreatePublication'

export const useReset = <Value>(path: string, initialValue: Value, cb: (init: Value) => void) => {
  const updateCtx = useCreatePublicationCtxUpdate()
  const status = useCreatePublicationCtxSelect((store) => store.status)

  useEffect(() => {
    if (status === 'reset') {
      cb?.(initialValue)
      updateCtx((ctx) => setImmutable(ctx, `changeState.${path}`, initialValue))
    }
  }, [updateCtx, status, cb, initialValue, path])
}
