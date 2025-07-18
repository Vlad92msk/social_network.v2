import { useRef } from 'react'
import { Image, resolveImageUrl } from '@components/ui'
import { availableImages, useMaterialsAttach } from '@hooks'
import { userAboutSynapse } from '@store/synapses/user-about'
import { useSelector } from 'synapse-storage/react'

import { cn } from '../cn'

const { selectors, actions } = userAboutSynapse

interface ProfileImageProps {}

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
        image: resolveImageUrl(newFile[0]),
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
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} accept={Object.values(availableImages).join(',')} />
    </>
  )
}
