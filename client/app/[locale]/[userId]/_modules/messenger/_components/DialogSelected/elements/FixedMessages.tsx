import { useScrollToElement } from '@hooks'
import { Button } from '@ui/common/Button'
import { Icon } from '@ui/common/Icon'
import { Text } from '@ui/common/Text'
import { useMessageStore } from '../../../_providers/message/message.provider'
import { cn } from '../cn'

export const FixedMessages = () => {
  const fixedMessages = useMessageStore((store) => store.getCurrentDialog().apiData?.fixedMessages)

  const scrollToComment = useScrollToElement({
    behavior: 'smooth',
  })

  if (!fixedMessages) return null
  return (
    <div className={cn('FixedMessages')}>
      {fixedMessages.map(({id, forwardMessageId, text}) => (
        <div className={cn('FixedMessagesBox')} key={id}>
          <Button className={cn('FixedMessagesContent')} onClick={() => {
            scrollToComment({
              targetElementId: forwardMessageId
            })
          }}>
            <Text weight={'bold'} fs={'12'}>Закрепленное сообщение</Text>
            <Text fs={'12'}>{text}</Text>
          </Button>
          <Button className={cn('FixedMessagesButtonRemove')} onClick={() => console.log('remove', id)}>
            <Icon name={'close'} />
          </Button>
        </div>
      ))}
    </div>
  )
}
