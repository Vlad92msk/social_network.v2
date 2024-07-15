import { useRef } from 'react'
import { useRect } from '@hooks'
import { classNames, rem } from '@utils/others'
import { cn } from './cn'

interface InputGroupCommonProps {
  className?: string
  children?: React.ReactNode
  leftElement?: React.ReactNode
  rightElement?: React.ReactNode
}

export function InputGroup(props: InputGroupCommonProps) {
  const { className, children, leftElement, rightElement, ...rest } = props

  const containerRef = useRef<HTMLDivElement>(null)
  const { width: containerWidth = 0 } = useRect({
    ref: containerRef,
    watchProps: ['width'],
    options: { stopFunc: 'debounce', ms: 200 },
  })

  const leftRef = useRef<HTMLDivElement>(null)
  const { width: leftWidth = 0 } = useRect({
    ref: leftRef,
    watchProps: ['width'],
    options: { stopFunc: 'debounce', ms: 200 },
  })

  const rightRef = useRef<HTMLDivElement>(null)
  const { width: rightWidth = 0 } = useRect({
    ref: rightRef,
    watchProps: ['width'],
    options: { stopFunc: 'debounce', ms: 200 },
  })

  return (
    <div ref={containerRef} className={classNames(cn('Group'), className)} {...rest}>
      {leftElement && <div ref={leftRef} className={cn('GroupLeftElement')}>{leftElement}</div>}
      <div className={cn('GroupCenter')} style={{ maxWidth: rem(containerWidth - leftWidth - rightWidth) }}>{children}</div>
      {rightElement && (<div ref={rightRef} className={cn('GroupRightElement')}>{rightElement}</div>)}
    </div>
  )
}
