import { Dispatch, SetStateAction, useState } from 'react'
import { useReset } from './useReset'
import { useAboutMeCtxSelect, useAboutMeCtxUpdate } from '../AboutMe'

export const useUpdateContextField = <T, >(text: T, name: string): [T, Dispatch<SetStateAction<T>>, (boolean | undefined), ReturnType<typeof useAboutMeCtxUpdate>] => {
  const [value, setValue] = useState<T>(text)
  const isChangeActive = useAboutMeCtxSelect((store) => (store.isChangeActive))
  const updateCtx = useAboutMeCtxUpdate()
  useReset(name, text, setValue)

  return [value, setValue, isChangeActive, updateCtx]
}
