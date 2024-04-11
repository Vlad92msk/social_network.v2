import { PropsWithChildren, useMemo } from 'react'

export const GroupMemo = (props: PropsWithChildren<{deps: unknown[]}>) => {
  const { deps, children } = props
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => children, [...deps])
}
