import { cn } from '@ui/common/InputCommon/cn'
import { RootWrapper } from '@ui/components/Publication/elements'
import { classNames } from '@utils/others'

interface MessageProps {
  className?: string
}

export function Message(props: MessageProps) {
  const { className } = props
  return (
    <RootWrapper
      className={classNames(cn('Message'), className)}
      publicationType="message"
    >
      Message
    </RootWrapper>
  )
}
