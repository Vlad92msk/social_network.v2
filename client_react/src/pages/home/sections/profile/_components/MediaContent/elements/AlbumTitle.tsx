import { useCallback, useState } from 'react'
import { Icon, Input, Text } from '@components/ui'
import { userMediaSynapse } from '@store/synapses/user-media'

import { MediaResponseDto } from '../../../../../../../../../swagger/media/interfaces-media'
import { cn } from '../cn'

const { actions } = userMediaSynapse

interface AlbumTitleProps {
  title: string
  items: MediaResponseDto[]
}

export function AlbumTitle(props: AlbumTitleProps) {
  const { title: initialTitle, items } = props

  const [getInitialTitle, setInitialTitle] = useState(initialTitle)
  const [getTitle, setTitle] = useState(getInitialTitle)
  const [isAlbumChangeTitle, onAlbumChangeTitle] = useState(false)

  const onSubmitNewAlbumName = useCallback(
    async (newTitle: string) => {
      if (newTitle?.length) {
        await actions.updateMediaInit({
          body: {
            target_ids: items.map(({ id }) => id),
            album_name: newTitle,
          },
        })
        setInitialTitle(newTitle)
        setTitle(newTitle)
      }
    },
    [items],
  )

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
          <button
            onClick={() => {
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
