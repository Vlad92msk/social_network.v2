import { useRef } from 'react'
import { useSelector } from 'synapse-storage/react'
import { availableImages, useMaterialsAttach } from '@hooks'
import { Image } from '@ui/common/Image'
import { fileObjectToImageUrl } from '@ui/common/Image/utils/fileObjectToImageUrl.util'
import { userInfoSynapse } from '../../../../../../../store/synapses/user-info/user-info.synapse'
import { cn } from '../cn'

const { selectors, actions } = userInfoSynapse

interface ProfileImageProps {
}

export function ProfileImage(props: ProfileImageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fieldImage = useSelector(selectors.fieldImage)
  const isChangeActive = useSelector(selectors.isChangeActive)

  const [addedFiles, handleAddFiles] = useMaterialsAttach({
    availableTypes: Object.values(availableImages),
    maxFileSize: '10mb',
    getFiles: (newFile) => {
      actions.updateField({
        imageUploadFile: newFile[0],
        image: fileObjectToImageUrl(newFile[0]),
      })
    },
  })

  const handleImageClick = () => {
    if (isChangeActive) {
      fileInputRef.current?.click()
    }
  }
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleAddFiles(event)
    event.target.value = '' // Очищаем значение input
  }

  return (
    <>
      <div className={cn('MyPhoto', { active: isChangeActive })} onClick={handleImageClick}>
        <Image alt="i_am" src={fieldImage} width={70} height={70} />
      </div>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept={Object.values(availableImages)
          .join(',')}
      />
    </>
  )
}
