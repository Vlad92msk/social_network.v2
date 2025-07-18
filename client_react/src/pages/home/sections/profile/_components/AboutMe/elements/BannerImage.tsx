import React, { useRef } from 'react'
import { Image, resolveImageUrl } from '@components/ui'
import { availableImages, useMaterialsAttach } from '@hooks'
import { userAboutSynapse } from '@store/synapses/user-about'
import { useSelector } from 'synapse-storage/react'

import { cn } from '../cn'

const { selectors, actions } = userAboutSynapse

interface BannerImageProps {}

export const BannerImage = React.memo((props: BannerImageProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fieldbanner = useSelector(selectors.fieldbanner)
  const isChangeActive = useSelector(selectors.isChangeActive)

  const [addedFiles, handleAddFiles] = useMaterialsAttach({
    availableTypes: Object.values(availableImages),
    maxFileSize: '5mb',
    getFiles: (newFile) => {
      actions.updateField({
        bannerUploadFile: newFile[0],
        banner: resolveImageUrl(newFile[0]),
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
  console.log('isChangeActive', isChangeActive)
  return (
    <>
      <div className={cn('BannerBck', { active: isChangeActive })} onClick={handleImageClick}>
        <Image alt="banner" src={fieldbanner} width={400} height={200} />
      </div>
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} accept={Object.values(availableImages).join(',')} />
    </>
  )
})
