import { Button } from '../Button'
import { cn } from './cn.ts'
import { classNames } from '@utils'
import { PropsWithChildren } from 'react'
import { useTabCtxSelect, useTabCtxUpdate } from './Tab'

interface OptionProps extends PropsWithChildren {
  id: string
  className?: string
}

export function Option(props: OptionProps) {
  const { id, className, children } = props
  const updateTab = useTabCtxUpdate()
  // @ts-ignore
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
