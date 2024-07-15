import { Icon } from 'app/_ui/common/Icon'
import { Text } from 'app/_ui/common/Text'
import { cn } from '../cn'

interface EmojiesProps {
  onClick?: (emojie: Record<string, any>) => void
}
export function Emojies(props: EmojiesProps) {
  const { onClick } = props

  return (
    <div className={cn('Emojies')}>
      <button className={cn('EmojieBox')} onClick={() => onClick?.({ name: 'thump-up' })}>
        <Icon name="thump-up" />
        <Text fs="12" letterSpacing={0.18}>2</Text>
      </button>
      <button className={cn('EmojieBox')} onClick={() => onClick?.({ name: 'thumb-down' })}>
        <Icon name="thumb-down" />
        <Text fs="12" letterSpacing={0.18}>20</Text>
      </button>
    </div>
  )
}
