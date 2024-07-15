import { ButtonDownload } from '@ui/common/ButtonDownload'
import { cn } from '../cn'

interface MediaOtherProps {
  files: any[];
}

export function MediaOther({ files }: MediaOtherProps) {

  if (!files || files.length === 0) return null
  return (
    <div className={cn('MediaContainerMediaOther')}>
      {files.map((file, index) => (
        <div key={index} className={cn('MediaContainerMediaOtherItem')}>
          <ButtonDownload file={file} />
        </div>
      ))}
    </div>
  )
}
