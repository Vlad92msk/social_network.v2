import { useSelector } from 'react-redux'
import { useScrollToElement } from '@hooks'
import { Button } from '@ui/common/Button'
import { Icon } from '@ui/common/Icon'
import { Text } from '@ui/common/Text'
import { MessengerSelectors } from '@ui/modules/messenger/store/selectors'
import { dialogsApi } from '../../../../../../../store/api'
import { cn } from '../cn'

export function FixedMessages() {
  const fixedMessages = useSelector(MessengerSelectors.selectCurrentDialogFixedMessages)
  const dialogId = useSelector(MessengerSelectors.selectCurrentDialogId)
  const [onPin] = dialogsApi.useRemoveFixedMessageMutation()

  const scrollToComment = useScrollToElement({
    behavior: 'smooth',
  })

  if (!fixedMessages?.length) return null
  return (
    <div className={cn('FixedMessages')}>
      <div className={cn('FixedMessagesSticks')}>
        {fixedMessages.map(({ id }) => <span key={id} className={cn('FixedMessagesStickElement')} />)}
      </div>
      <div className={cn('FixedMessagesList')}>
        {fixedMessages.map(({ id, text }) => (
          <div key={id} className={cn('FixedMessagesBox')}>
            <Button
              className={cn('FixedMessagesContent')}
              onClick={() => {
                scrollToComment({
                  targetElementId: id,
                })
              }}
            >
              <Text weight="bold" fs="12">Закрепленное сообщение</Text>
              <Text fs="12">{text}</Text>
            </Button>
            <Button
              className={cn('FixedMessagesButtonRemove')}
              onClick={() => {
                onPin({ id: dialogId, message_id: id })
              }}
            >
              <Icon name="close" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
