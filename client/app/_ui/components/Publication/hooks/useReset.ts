import { usePublicationCtxSelect, usePublicationCtxUpdate } from '@ui/components/Publication'
import { setImmutable } from '@utils/others'
import { useEffect } from 'react'

export const useReset = <Value>(path: string, initialValue: Value, cb: (init: Value) => void) => {
  const updateCtx = usePublicationCtxUpdate()
  const status = usePublicationCtxSelect((store) => store.status)

  useEffect(() => {
    if (status === 'reset') {
      cb?.(initialValue)
      updateCtx((ctx) => setImmutable(ctx, `changeState.${path}`, initialValue))
    }
  }, [updateCtx, status])

}
