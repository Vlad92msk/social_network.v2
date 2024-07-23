import { PropsWithChildren } from 'react'
import { Button } from '@ui/common/Button'
import { cn } from '@ui/common/Tab/cn'
import { classNames } from '@utils/others'
import { useTabCtxSelect, useTabCtxUpdate } from './Tab'

interface OptionProps extends PropsWithChildren {
  id: string
  className?: string
}

export function Option(props: OptionProps) {
  const { id, className, children } = props
  const updateTab = useTabCtxUpdate()
  const activeId = useTabCtxSelect((ctx) => ctx.activeId)

  return (
    <Button
      key={id}
      className={classNames(cn('TabOption', { active: id === activeId }), className)}
      onClick={() => updateTab(() => ({ activeId: id }))}
    >
      {children}
    </Button>
  )
}
