import { IconBase } from '@ui/base/IconBase'
import { TextCommon } from '@ui/common/TextCommon'
import { cn } from '../cn'

interface CommentsProps {
  onClick: VoidFunction
  countComments: number
}
export function Comments(props: CommentsProps) {
  const { countComments, onClick } = props

  return (
    <button className={cn('Commets')} onClick={onClick}>
      <IconBase name="chat" />
      <TextCommon fs="12" letterSpacing={0.18}>{countComments}</TextCommon>
    </button>
  )
}
