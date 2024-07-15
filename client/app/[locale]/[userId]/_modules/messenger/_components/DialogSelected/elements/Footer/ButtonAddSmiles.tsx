import { Icon } from 'app/_ui/common/Icon'
import { cn } from './cn'

export function ButtonAddSmiles() {
  return (
    <button className={cn('ButtonAddSmiles')}>
      <Icon name="face-smiling" />
    </button>
  )
}
