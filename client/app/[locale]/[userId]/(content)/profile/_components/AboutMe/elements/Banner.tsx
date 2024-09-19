import { UserInfo } from '@api/users/types/user.type'
import { AddedFile, availableFormats, availableImages, useMaterialsAttach } from '@hooks'
import { Button } from '@ui/common/Button'
import { Image } from '@ui/common/Image'
import { setImmutable } from '@utils/others'
import { useRef } from 'react'
import { useUpdateContextField } from '../hooks'
import { ContactsList } from './ContactsList'
import { cn } from '../cn'

interface BannerProps {
  contacts?: UserInfo[]
  onClickUser?: (id: string) => void
  bunner_image?: string
  image?: string
}

export function Banner(props: BannerProps) {
  const { contacts, onClickUser, image, bunner_image } = props
  const [getValue, setValue, isChangeActive, updateCtx] = useUpdateContextField(undefined, 'imageUploadFile')
  const [addedFiles, handleAddFiles] = useMaterialsAttach({
    availableTypes: Object.values(availableImages),
    maxFileSize: '5mb',
    getFiles: (newText) => {
      updateCtx((ctx) => setImmutable(ctx, 'changeState.imageUploadFile', newText[0]))
    }
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageClick = () => {
    if (isChangeActive){
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleAddFiles(event)
    event.target.value = '' // Очищаем значение input
  }

  return (
    <div className={cn('Banner')}>
      <div className={cn('BannerBck')}>
        <Image alt="bunner" src={bunner_image} width={400} height={200}/>
      </div>
      <div className={cn('MyPhoto')} onClick={handleImageClick}>
        <Image alt="i_am" src={image} width={70} height={70}/>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept={Object.values(availableImages).join(',')}
      />
      {/* <ContactsList */}
      {/*   contacts={contacts} */}
      {/*   onClickUser={onClickUser} */}
      {/*   renderContacts={(visible) => ( */}
      {/*     visible.map(({ id, name, profileImage }, index) => ( */}
      {/*       <Button */}
      {/*         key={id} */}
      {/*         className={cn('ContactItemBox')} */}
      {/*         onClick={() => onClickUser?.(id)} */}
      {/*         style={{ */}
      {/*           zIndex: 3 - (index + 1), */}
      {/*           transform: `translateX(${10 * (3 - (index + 1))}px)`, */}
      {/*         }} */}
      {/*       > */}
      {/*         <Image src={profileImage} width={40} height={40} alt={name || id} /> */}
      {/*       </Button> */}
      {/*     )) */}
      {/*   )} */}
      {/* /> */}
    </div>
  )
}
