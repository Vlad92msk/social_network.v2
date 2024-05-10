import { classNames } from '@utils/others'
import { cn } from './cn'
import {
  Author, ChangeContainer, Commets, DateDelivery, Emojies, MediaContainer, Text, DateCreated
} from './elements'

interface PostProps {
  className?: string
}

export function Post(props: PostProps) {
  const { className } = props

  return (
    <div className={classNames(cn(), className)}>
      <Author />
      <ChangeContainer />
      <MediaContainer />
      <Text />
      <Emojies />
      <Commets />
      <DateDelivery />
      <DateCreated />
    </div>
  )
}
