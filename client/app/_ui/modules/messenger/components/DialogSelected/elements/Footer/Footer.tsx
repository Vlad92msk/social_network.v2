import { CreatePublication, CreatePublicationContextProps, MyFile } from '@ui/components/create-publication'
import { useMessageStore } from '@ui/modules/messenger/store'
import { cn } from './cn'
import { dialogsApi } from '../../../../../../../../store/api'

// Вспомогательная функция для конвертации File в base64
function fileToBase64(file: MyFile): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file.blob)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

export function Footer() {
  const openDialogId = useMessageStore((store) => store.openDialogId)
  const selectUser = useMessageStore((store) => store.selectUser)

  const [sendMessage] = dialogsApi.useSendMessageMutation()

  const handleSubmit = async (newMessage: CreatePublicationContextProps) => {
    if (!openDialogId && !selectUser) {
      console.error('No dialog or user selected')
      return
    }

    const messageData = {
      text: newMessage.text,
      participants: selectUser ? [selectUser.id] : undefined,
      dialog_id: openDialogId,
      media: newMessage.media ? await Promise.all(newMessage.media.map(fileToBase64)) : undefined,
      voices: newMessage.voices ? await Promise.all(newMessage.voices.map(fileToBase64)) : undefined,
      videos: newMessage.videos ? await Promise.all(newMessage.videos.map(fileToBase64)) : undefined,
    }

    sendMessage({ dialogId: openDialogId, message: messageData })
  }

  return (
    <CreatePublication
      className={cn('CreateMessage')}
      onSubmit={handleSubmit}
    />
  )
}
