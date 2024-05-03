import { IconBase } from '@ui/base/IconBase'
import { cn } from './cn'

export function ButtonAddSmiles() {
  return (
    <button className={cn('ButtonAddSmiles')}>
      <IconBase name="face-smiling" />
    </button>
  )
}
