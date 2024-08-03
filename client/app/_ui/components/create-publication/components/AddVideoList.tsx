import { useCallback } from 'react'
import { Button } from '@ui/common/Button'
import { Icon } from '@ui/common/Icon'
import { Text } from '@ui/common/Text'
import { setImmutable } from '@utils/others'
import { VoiceMessage } from './ButtonAddVoice'
import { cn } from '../cn'
import { useCreatePublicationCtxSelect, useCreatePublicationCtxUpdate } from '../CreatePublication'

export function AddVideoList() {
  const videos = useCreatePublicationCtxSelect((ctx) => ctx.videos)
  const update = useCreatePublicationCtxUpdate()

  const deleteVoiceMessage = useCallback((id: string) => {
    update((ctx) => {
      const updatedVoices = (ctx.videos || []).filter((voice: VoiceMessage) => voice.id !== id)
      return setImmutable(ctx, 'videos', updatedVoices)
    })
  }, [update])

  if (!videos || !videos.length) return null
  return (
    <div className={cn('AddVideoList')}>
      <Text className={cn('AddVideoListTitle')} fs="12">Добавленные видео</Text>
      <div className={cn('AddVideoListList')}>
        {videos.map((data) => (
          <div className={cn('AddVideoListBox')} key={data.src}>
            <video controls>
              <source src={data.url} type={data.type} />
            </video>
            <Button className={cn('AddVideoListButtonRemove')} onClick={() => deleteVoiceMessage(data.id)}>
              <Icon name="close" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
