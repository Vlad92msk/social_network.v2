import { useCallback, useState } from 'react'
import { useSelector } from 'react-redux'
import { Icon } from '@ui/common/Icon'
import { Input } from '@ui/common/Input'
import { Text } from '@ui/common/Text'
import { MessengerSelectors } from '@ui/modules/messenger/store/selectors'
import { cn } from './cn'
import { dialogsApi } from '../../../../../../../../store/api'

interface TitleProps {
  title: string
}

export function Title(props: TitleProps) {
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
      onUpdate({ body: { title: newTitle }, id: dialogId })
    }
  }, [dialogId, onUpdate])

  const handleToggle = () => {
    onAlbumChangeTitle((prev) => !prev)
  }

  return (
    <div className={cn('TitleContainer')}>
      {isAlbumChangeTitle ? (
        <Input onChange={(event) => setTitle(event.target.value)} value={getTitle} />
      ) : (
        <Text fs="12" weight="bold">
          {getTitle || 'Нет заголовка'}
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
            disabled={Boolean(!getTitle?.length)}
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
