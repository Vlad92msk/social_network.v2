import { useEffect } from 'react'
import { setImmutable } from '@utils/others'
import { useAboutMeCtxSelect, useAboutMeCtxUpdate } from '../AboutMe'

export const useReset = <Value>(path: string, initialValue: Value, cb: (init: Value) => void) => {
  const updateCtx = useAboutMeCtxUpdate()
  const status = useAboutMeCtxSelect((store) => store.status)

  useEffect(() => {
    if (status === 'reset') {
      cb?.(initialValue)
      updateCtx((ctx) => setImmutable(ctx, `changeState.${path}`, initialValue))
    }
  }, [updateCtx, status, cb, initialValue, path])
}
