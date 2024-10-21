// @ts-ignore
import { FILE_FORMAT_APP, FILE_FORMAT_AUDIO, FILE_FORMAT_IMAGE, FILE_FORMAT_TEXT, FILE_FORMAT_VIDEO } from '@types/fileFormats'
import { FileUpLoad } from '@ui/common/FileUpLoad'
import { setImmutable } from '@utils/others'
import { cn } from '../cn'
import { useCreatePublicationCtxUpdate } from '../CreatePublication'

interface ButtonAttachmentProps {
}

export function ButtonAttachment(props: ButtonAttachmentProps) {
  const {
  } = props
  const update = useCreatePublicationCtxUpdate()
  return (
    <FileUpLoad
      className={cn('UploadFile')}
      icon="attachment"
      isConfirm
      availableTypes={{
        // maxFileSize: '1mb',
        // просто как пример
        availableTypes: [
          FILE_FORMAT_IMAGE.JPG,
          FILE_FORMAT_IMAGE.PNG,
          FILE_FORMAT_IMAGE.WEBP,
          FILE_FORMAT_VIDEO.MP4,
          FILE_FORMAT_VIDEO.MOVIE,
          FILE_FORMAT_VIDEO.MPEG,
          FILE_FORMAT_AUDIO.MP4A,
          FILE_FORMAT_TEXT.TXT,
          FILE_FORMAT_APP.XLSX,
        ],
      }}
      onApplyWithGroup={(files) => {
        update((ctx) => setImmutable(ctx, 'media', files))
      }}
    />
  )
}
