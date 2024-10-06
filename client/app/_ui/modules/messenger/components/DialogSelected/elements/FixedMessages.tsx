import { useScrollToElement } from '@hooks'
import { Button } from '@ui/common/Button'
import { Icon } from '@ui/common/Icon'
import { Text } from '@ui/common/Text'
import { dialogsApi } from '../../../../../../../store/api'
import { useMessageStore } from '../../../store'
import { cn } from '../cn'

export function FixedMessages() {
  const openDialogId = useMessageStore((store) => store.openDialogId)

  const { fixedMessages } = dialogsApi.useFindOneQuery(
    { id: openDialogId },
    {
      skip: !Boolean(openDialogId?.length),
      selectFromResult: ({ data }) => ({
        fixedMessages: data?.fixed_messages ?? [],
      }),
    },
  )

  const scrollToComment = useScrollToElement({
    behavior: 'smooth',
  })

  if (!fixedMessages?.length) return null
  return (
    <div className={cn('FixedMessages')}>
      {fixedMessages.map(({ id, text, reply_to }) => (
        <div className={cn('FixedMessagesBox')} key={id}>
          <Button
            className={cn('FixedMessagesContent')}
            onClick={() => {
              scrollToComment({
                targetElementId: reply_to?.id,
              })
            }}
          >
            <Text weight="bold" fs="12">Закрепленное сообщение</Text>
            <Text fs="12">{text}</Text>
          </Button>
          <Button className={cn('FixedMessagesButtonRemove')} onClick={() => console.log('remove', id)}>
            <Icon name="close" />
          </Button>
        </div>
      ))}
    </div>
  )
}
