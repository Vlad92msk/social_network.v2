import { availableImages, useMaterialsAttach } from '@hooks'
import { Image } from '@ui/common/Image'
import { fileObjectToImageUrl } from '@ui/common/Image/utils/fileObjectToImageUrl.util'
import { useSelector } from 'synapse-storage/react'
import { useRef } from 'react'
import { userInfoSynapse } from '../../../../../../../store/synapses/user-info/user-info.synapse'
import { cn } from '../cn'

const { selectors, actions } = userInfoSynapse

interface BannerImageProps {
}

export const BannerImage = (props: BannerImageProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fieldbanner = useSelector(selectors.fieldbanner)
  const isChangeActive = useSelector(selectors.isChangeActive)


  const [addedFiles, handleAddFiles] = useMaterialsAttach({
    availableTypes: Object.values(availableImages),
    maxFileSize: '5mb',
    getFiles: (newFile) => {
      actions.updateField({
        bannerUploadFile: newFile[0],
        banner: fileObjectToImageUrl(newFile[0]),
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
      <div className={cn('BannerBck', { active: isChangeActive })} onClick={handleImageClick}>
        <Image alt="banner" src={fieldbanner} width={400} height={200} />
      </div>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept={Object.values(availableImages).join(',')}
      />
    </>
  )
}
