import { CreatePublication, CreatePublicationContextProps, MyFile } from '@ui/components/create-publication'
import { useMessageStore } from '@ui/modules/messenger/store'
import { MessengerSelectors } from '@ui/modules/messenger/store/messenger.slice'
import { useSelector } from 'react-redux'
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
  const selectUser = useMessageStore((store) => store.selectUser)
  const selectСurrentDialogId = useSelector(MessengerSelectors.selectСurrentDialogId)

  const [sendMessage] = dialogsApi.useSendMessageMutation()

  const handleSubmit = async (newMessage: CreatePublicationContextProps) => {
    if (!selectСurrentDialogId && !selectUser) {
      console.error('No dialog or user selected')
      return
    }

    const messageData = {
      text: newMessage.text,
      participants: selectUser ? [selectUser.id] : undefined,
      dialog_id: selectСurrentDialogId,
      media: newMessage.media ? await Promise.all(newMessage.media.map(fileToBase64)) : undefined,
      voices: newMessage.voices ? await Promise.all(newMessage.voices.map(fileToBase64)) : undefined,
      videos: newMessage.videos ? await Promise.all(newMessage.videos.map(fileToBase64)) : undefined,
    }

    sendMessage({ dialogId: selectСurrentDialogId, message: messageData })
  }

  return (
    <CreatePublication
      className={cn('CreateMessage')}
      onSubmit={handleSubmit}
    />
  )
}
