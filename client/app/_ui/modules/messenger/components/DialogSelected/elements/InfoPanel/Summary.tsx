import { useCallback, useState } from 'react'
import { useSelector } from 'react-redux'
import { Icon } from '@ui/common/Icon'
import { TextArea } from '@ui/common/Input'
import { Text } from '@ui/common/Text'
import { MessengerSelectors } from '@ui/modules/messenger/store/selectors'
import { cn } from './cn'
import { dialogsApi } from '../../../../../../../../store/api'

interface SummaryProps {
  title: string
}

export function Summary(props: SummaryProps) {
  const { title: initialTitle } = props

  const dialogId = useSelector(MessengerSelectors.selectCurrentDialogId)
  const [onUpdate] = dialogsApi.useUpdateMutation()

  const [getInitialTitle, setInitialTitle] = useState(initialTitle)
  const [getTitle, setTitle] = useState(getInitialTitle)
  const [isAlbumChangeTitle, onAlbumChangeTitle] = useState(false)

  const onSubmitNewAlbumName = useCallback((newTitle: string) => {
    if (newTitle?.length) {
      setInitialTitle(newTitle)
      setTitle(newTitle)
      onUpdate({ body: { description: newTitle }, id: dialogId })
    }
  }, [dialogId, onUpdate])

  const handleToggle = () => {
    onAlbumChangeTitle((prev) => !prev)
  }

  return (
    <div className={cn('SummaryContainer')}>
      {isAlbumChangeTitle ? (
        <TextArea className={cn('SummaryTextArea')} onChange={(event) => setTitle(event.target.value)} value={getTitle} />
      ) : (
        <Text fs="12" weight="bold">
          {getTitle || 'Нет описания'}
        </Text>
      )}
      {!isAlbumChangeTitle && (
        <button onClick={handleToggle}>
          <Icon name="edit" />
        </button>
      )}
      {isAlbumChangeTitle && (
        <div>
          <button onClick={() => {
            setTitle(getInitialTitle)
            handleToggle()
          }}
          >
            <Icon name="close" />
          </button>
          <button
            onClick={() => {
              onSubmitNewAlbumName(getTitle)
              handleToggle()
            }}
          >
            <Icon name="approve" />
          </button>
        </div>
      )}
    </div>
  )
}
