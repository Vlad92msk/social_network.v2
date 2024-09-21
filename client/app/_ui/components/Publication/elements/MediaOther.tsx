import { uniq } from 'lodash'
import { useCallback, useState } from 'react'
import { ButtonDownload } from '@ui/common/ButtonDownload'
import { MediaEntity } from '../../../../../../swagger/media/interfaces-media'
import { MediaElement } from './MediaElement'
import { cn } from '../cn'
import { useReset } from '../hooks'
import { usePublicationCtxUpdate } from '../Publication'

interface MediaOtherProps {
  data: MediaEntity[];
}

export function MediaOther({ data }: MediaOtherProps) {
  const handleSetChangeActive = usePublicationCtxUpdate()

  const [usingData, setUsingData] = useState(data)

  const handleRemove = useCallback((removeMedia: MediaEntity) => {
    setUsingData((prev) => {
      const result = prev.filter((i) => i.id !== removeMedia.id)
      handleSetChangeActive((ctx) => ({
        ...ctx,
        changeState: {
          media: {
            ...(ctx.changeState?.media || {}),
            other: result,
          },
          removeMediaIds: uniq([...(ctx.changeState?.removeMediaIds || []), removeMedia.id]),
        },
      }))
      return result
    })
  }, [handleSetChangeActive])

  useReset('media.other', data, setUsingData)

  if (!usingData || usingData.length === 0) return null
  return (
    <div className={cn('MediaContainerMediaOther')}>
      {usingData.map((file) => (
        <MediaElement
          key={file.id}
          data={file}
          element={(data) => (
            <div className={cn('MediaContainerMediaOtherItem')}>
              <ButtonDownload file={data} />
            </div>
          )}
          onRemove={handleRemove}
        />
      ))}
    </div>
  )
}
