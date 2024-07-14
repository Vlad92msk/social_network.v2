import { IconBase } from '@ui/base/IconBase'
import { TextCommon } from '@ui/common/TextCommon'
import { cn } from '../cn'

interface EmojiesProps {
  onClick?: (emojie: Record<string, any>) => void
}
export function Emojies(props: EmojiesProps) {
  const { onClick } = props

  return (
    <div className={cn('Emojies')}>
      <button className={cn('EmojieBox')} onClick={() => onClick?.({ name: 'thump-up' })}>
        <IconBase name="thump-up" />
        <TextCommon fs="12" letterSpacing={0.18}>2</TextCommon>
      </button>
      <button className={cn('EmojieBox')} onClick={() => onClick?.({ name: 'thumb-down' })}>
        <IconBase name="thumb-down" />
        <TextCommon fs="12" letterSpacing={0.18}>20</TextCommon>
      </button>
    </div>
  )
}
