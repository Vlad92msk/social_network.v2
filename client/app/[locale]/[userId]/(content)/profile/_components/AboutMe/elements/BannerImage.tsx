import { availableImages, useMaterialsAttach } from '@hooks'
import { Image } from '@ui/common/Image'
import { setImmutable } from '@utils/others'
import { useRef } from 'react'
import { cn } from '../cn'
import { useUpdateContextField } from '../hooks'

interface BannerImageProps {
  bunner_image?: string
}

export const BannerImage = (props: BannerImageProps) => {
  const { bunner_image } = props
  const [getValue, setValue, isChangeActive, updateCtx] = useUpdateContextField(undefined, 'bannerUploadFile')
  const [addedFiles, handleAddFiles] = useMaterialsAttach({
    availableTypes: Object.values(availableImages),
    maxFileSize: '5mb',
    getFiles: (newText) => {
      updateCtx((ctx) => setImmutable(ctx, 'changeState.bannerUploadFile', newText[0]))
    },
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

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
        <Image alt="bunner" src={bunner_image} width={400} height={200}/>
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
