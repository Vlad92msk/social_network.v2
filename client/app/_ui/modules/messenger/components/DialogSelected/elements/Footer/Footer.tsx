import { CreatePublication, CreatePublicationContextProps } from '@ui/components/create-publication'
import { useMessageStore } from '@ui/modules/messenger/store'
import { cn } from './cn'
import { dialogsApi } from '../../../../../../../../store/api'

export function Footer() {
  const openDialogId = useMessageStore((store) => store.openDialogId)
  const selectUser = useMessageStore((store) => store.selectUser)

  const [submit] = dialogsApi.useAddMessageToDialogMutation()

  const handleSubmit = (newMessage: CreatePublicationContextProps) => {
    console.log('newMessage', newMessage)
    const formData = new FormData()
    formData.append('text', newMessage.text)

    if (selectUser) {
      // Отправляем ID участника как отдельное поле
      formData.append('participants[]', String(selectUser.id))
    }

    if (openDialogId) {
      formData.append('dialog_id', openDialogId)
    }

    if (newMessage.media) {
      Object.values(newMessage.media).flat().forEach((file) => {
        formData.append('media', file.blob, file.name)
      })
    }

    if (newMessage.voices) {
      newMessage.voices.forEach((file) => {
        formData.append('voices', file.blob, file.name)
      })
    }

    if (newMessage.videos) {
      newMessage.videos.forEach((file) => {
        formData.append('videos', file.blob, file.name)
      })
    }

    // @ts-ignore
    submit({ body: formData })
  }

  return (
    <CreatePublication
      className={cn('CreateMessage')}
      onSubmit={handleSubmit}
    />
  )
}
