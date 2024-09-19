import { availableImages, useMaterialsAttach } from '@hooks'
import { Image } from '@ui/common/Image'
import { setImmutable } from '@utils/others'
import { useRef } from 'react'
import { cn } from '../cn'
import { useUpdateContextField } from '../hooks'

interface ProfileImageProps {
  image?: string
}

export const ProfileImage = (props: ProfileImageProps) => {
  const { image } = props
  const [getValue, setValue, isChangeActive, updateCtx] = useUpdateContextField(undefined, 'imageUploadFile')
  const [addedFiles, handleAddFiles] = useMaterialsAttach({
    availableTypes: Object.values(availableImages),
    maxFileSize: '10mb',
    getFiles: (newText) => {
      updateCtx((ctx) => setImmutable(ctx, 'changeState.imageUploadFile', newText[0]))
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
      <div className={cn('MyPhoto', { active: isChangeActive })} onClick={handleImageClick}>
        <Image alt="i_am" src={image} width={70} height={70}/>
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
