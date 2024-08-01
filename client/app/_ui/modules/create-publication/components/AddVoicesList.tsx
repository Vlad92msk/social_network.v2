import { Icon } from '@ui/common/Icon'
import { useCallback } from 'react'
import { Button } from '@ui/common/Button'
import { Text } from '@ui/common/Text'
import { setImmutable } from '@utils/others'
import { VoiceMessage } from './ButtonAddVoice'
import { cn } from '../cn'
import { useCreatePublicationCtxSelect, useCreatePublicationCtxUpdate } from '../CreatePublication'

export function AddVoicesList() {
  const voices = useCreatePublicationCtxSelect((ctx) => ctx.voices)
  const update = useCreatePublicationCtxUpdate()

  const deleteVoiceMessage = useCallback((id: string) => {
    update((ctx) => {
      const updatedVoices = (ctx.voices || []).filter((voice: VoiceMessage) => voice.id !== id)
      return setImmutable(ctx, 'voices', updatedVoices)
    })
  }, [update])

  if (!voices || !voices.length) return null
  return (
    <div className={cn('AddVoicesList')}>
      <Text fs="12">Добавленные сообщения</Text>
      <div className={cn('AddVoicesListList')}>
        {voices.map((voice: VoiceMessage) => (
          <div className={cn('AddVoicesListBox')} key={voice.id}>
            <audio className={cn('AddVoicesListAudio')} src={voice.url} controls />
            <Button className={cn('AddVoicesListButtonRemove')} onClick={() => deleteVoiceMessage(voice.id)}>
              <Icon name="close" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
