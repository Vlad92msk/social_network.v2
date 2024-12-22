import { RichTextEditor } from '@ui/common/Input'
import { sortBy } from 'lodash'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useBooleanState, useScrollToElement } from '@hooks'
import { Button } from '@ui/common/Button'
import { Icon } from '@ui/common/Icon'
import { editorStateFromString, editorStateToPlainText } from '@ui/common/Input/hooks'
import { Text } from '@ui/common/Text'
import { MessengerSelectors } from '@ui/modules/messenger/store/selectors'
import { dialogsApi } from '../../../../../../../store/api'
import { cn } from '../cn'

export function FixedMessages() {
  const fixedMessages = useSelector(MessengerSelectors.selectCurrentDialogFixedMessages)
  const dialogId = useSelector(MessengerSelectors.selectCurrentDialogId)
  const [onPin] = dialogsApi.useRemoveFixedMessageMutation()

  const [isOpen, onOpen, onClose] = useBooleanState(false)

  if (!fixedMessages?.length) return null
  console.log('fixedMessages', fixedMessages)
  return (
    <div
      className={cn('FixedMessages', { isOpen })}
      style={{
        maxHeight: fixedMessages.length * 50 + 'px',
      }}
      onClick={() => {
        if (isOpen) {
          onClose()
        } else {
          onOpen()
        }
      }}
    >
      <div className={cn('FixedMessagesList')}>
        {sortBy(fixedMessages, ({date_created}) => date_created).map(({ id, text }) => (
          <div key={id} className={cn('FixedMessagesBox')}>
            <div className={cn('FixedMessagesContent')}>
              <Text weight="bold" fs="12">Закрепленное сообщение</Text>
              <Text fs="12">{editorStateToPlainText(editorStateFromString(text))}</Text>
            </div>
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
