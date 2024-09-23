import { Icon } from 'app/_ui/common/Icon'
import { Text } from 'app/_ui/common/Text'
import { cn } from '../cn'

interface CommentsProps {
  isActive?: boolean
  onClick: VoidFunction
  countComments: number
}
export function Comments(props: CommentsProps) {
  const { countComments, onClick, isActive } = props

  return (
    <button className={cn('Commets', { active: isActive })} onClick={onClick}>
      <Icon name="chat" />
      <Text fs="12" letterSpacing={0.18}>{countComments}</Text>
    </button>
  )
}
