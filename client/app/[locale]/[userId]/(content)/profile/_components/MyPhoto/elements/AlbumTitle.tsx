import { useCallback, useState } from 'react'
import { Icon } from '@ui/common/Icon'
import { Input } from '@ui/common/Input'
import { Text } from '@ui/common/Text'
import { MediaEntity } from '../../../../../../../../../swagger/media/interfaces-media'
import { mediaApi } from '../../../../../../../../store/api'
import { cn } from '../cn'

interface AlbumTitleProps {
  title: string
  items: MediaEntity[]
}

export function AlbumTitle(props: AlbumTitleProps) {
  const { title: initialTitle, items } = props
  const [onMediaUpdate] = mediaApi.useUpdateMediaMutation()

  const [getInitialTitle, setInitialTitle] = useState(initialTitle)
  const [getTitle, setTitle] = useState(getInitialTitle)
  const [isAlbumChangeTitle, onAlbumChangeTitle] = useState(false)

  const onSubmitNewAlbumName = useCallback((newTitle: string) => {
    if (newTitle?.length) {
      onMediaUpdate({ body: {
        target_ids: items.map(({ id }) => id),
        album_name: newTitle,
      } })
      setInitialTitle(newTitle)
      setTitle(newTitle)
    }
  }, [items, onMediaUpdate])

  const handleToggle = () => {
    onAlbumChangeTitle((prev) => !prev)
  }

  return (
    <div className={cn('AlbumTitleContainer')}>
      {isAlbumChangeTitle ? (
        <Input onChange={(event) => setTitle(event.target.value)} value={getTitle} />
      ) : (
        <Text className={cn('AlbumTitle')} fs="12" weight="bold">
          {getTitle}
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
