import { ButtonDownload } from '@ui/common/ButtonDownload'
import { usePublicationCtxUpdate } from '../Publication'
import { MediaElement } from './MediaElement'
import { useReset } from '../hooks'
import { setImmutable } from '@utils/others'
import { useState } from 'react'
import { cn } from '../cn'

interface MediaOtherProps {
  files: any[];
}

export function MediaOther({ files }: MediaOtherProps) {
  const handleSetChangeActive = usePublicationCtxUpdate()

  const [usingData, setUsingData] = useState(files)

  const handleRemove = (data) => {
    setUsingData((prev) => {
      const result = prev.filter((i) => i.src !== data.src)
      handleSetChangeActive((ctx) => setImmutable(ctx, 'changeState.media.other', result))
      return result
    })
  }
  useReset('media.other', files, setUsingData)

  if (!usingData || usingData.length === 0) return null
  return (
    <div className={cn('MediaContainerMediaOther')}>
      {usingData.map((file, index) => (
        <MediaElement
          key={file.src}
          data={file}
          element={(data) => (
            <div className={cn('MediaContainerMediaOtherItem')}>
              <ButtonDownload file={data}/>
            </div>
          )}
          onRemove={handleRemove}
        />
      ))}
    </div>
  )
}
