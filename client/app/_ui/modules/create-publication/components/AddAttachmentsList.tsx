import { forOwn } from 'lodash'
import { useCallback } from 'react'
import { Button } from '@ui/common/Button'
import { Icon } from '@ui/common/Icon'
import { Text } from '@ui/common/Text'
import { setImmutable } from '@utils/others'
import { PublicationMediaDTO } from '../../../../types/publicationDTO'
import { cn } from '../cn'
import { useCreatePublicationCtxSelect, useCreatePublicationCtxUpdate } from '../CreatePublication'

export function AddAttachmentsList() {
  const update = useCreatePublicationCtxUpdate()

  const media = useCreatePublicationCtxSelect((ctx) => {
    type Result = PublicationMediaDTO['image'][0] & {type: keyof PublicationMediaDTO}
    const result: Result[] = []

    forOwn(ctx.media, (value: PublicationMediaDTO['audio'], key: keyof PublicationMediaDTO) => {
      value?.forEach((mediaItem) => result.push({ ...mediaItem, type: key }))
    })

    return result
  })
  const deleteVoiceMessage = useCallback((type: keyof PublicationMediaDTO, src: string) => {
    update((ctx) => {
      const updatedVoices = ctx.media?.[type].filter((item) => item.src !== src)
      return setImmutable(ctx, `media[${type}]`, updatedVoices)
    })
  }, [update])

  if (!media || !media.length) return null
  return (
    <div className={cn('AddAttachmentsList')}>
      <Text fs="12">Добавленные файлы</Text>
      <div className={cn('AddAttachmentsListList')}>
        {media.map((data) => (
          <div className={cn('AddAttachmentsListBox')} key={data.src}>
            <img src={data.src} alt={data.name} style={{ maxHeight: 'inherit' }} />
            <Button className={cn('AddAttachmentsListButtonRemove')} onClick={() => deleteVoiceMessage(data.type, data.src)}>
              <Icon name="close" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
