import { useSelector } from 'react-redux'
import { FileUpLoad } from '@ui/common/FileUpLoad'
import { Image } from '@ui/common/Image'
import { MessengerSelectors } from '@ui/modules/messenger/store/selectors'
import { cn } from './cn'
import { dialogsApi } from '../../../../../../../../store/api'
import { FILE_FORMAT_IMAGE } from '../../../../../../../types/fileFormats'

interface ImageTitleProps {
  image: string
}

export function ImageTitle(props: ImageTitleProps) {
  const { image } = props
  const dialogId = useSelector(MessengerSelectors.selectCurrentDialogId)
  const [onUpdate] = dialogsApi.useUpdateMutation()

  return (
    <div className={cn('Image')}>
      <Image alt="d" width={20} height={20} src={image} />
      <FileUpLoad
        className={cn('UploadFile')}
        icon="attachment"
        isConfirm
        isSingleChoice
        availableTypes={{
          maxFileSize: '5mb',
          availableTypes: [
            FILE_FORMAT_IMAGE.JPG,
            FILE_FORMAT_IMAGE.PNG,
            FILE_FORMAT_IMAGE.WEBP,
          ],
        }}
        onApplyWithGroup={(files) => {
          const formData = new FormData()

          const newImage = files.image[0]

          if (newImage && newImage.blob) {
            formData.append('image', newImage.blob, newImage.name)
          }

          // @ts-ignore
          onUpdate({ id: dialogId, body: formData })
        }}
      />
    </div>
  )
}
