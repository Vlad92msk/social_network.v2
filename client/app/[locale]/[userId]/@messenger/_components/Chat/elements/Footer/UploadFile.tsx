import { FileUpLoad } from '@ui/common/FileUpLoadCommon'
import { cn } from './cn'
import { FILE_FORMAT_IMAGE } from '../../../../../../../types/fileFormats'
import { useChatStore } from '../../../../_providers/chat'

export function UploadFile() {
  const onCreateMessage = useChatStore((store) => store.onCreateMessage)

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
      onApply={(files) => onCreateMessage('media', files)}
    />
  )
}
