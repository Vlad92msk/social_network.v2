// @ts-ignore
import { FILE_FORMAT_IMAGE } from '@types/fileFormats'
import { FileUpLoad } from 'app/_ui/common/FileUpLoad'
import { cn } from './cn'
import { useMessageStore } from '../../../../store'

export function UploadFile() {
  const onCreateMessage = useMessageStore((store) => store.onCreateMessage)

  return (
    <FileUpLoad
      className={cn('UploadFile')}
      isConfirm
      availableTypes={{
        maxFileSize: '1mb',
        // просто как пример
        availableTypes: [
          FILE_FORMAT_IMAGE.JPG,
          FILE_FORMAT_IMAGE.PNG,
          FILE_FORMAT_IMAGE.WEBP,
        ],
      }}
      // @ts-ignore
      onApply={(files) => onCreateMessage('media', files)}
    />
  )
}
