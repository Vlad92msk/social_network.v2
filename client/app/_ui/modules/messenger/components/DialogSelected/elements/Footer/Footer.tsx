import { CreatePublication, CreatePublicationContextProps, MyFile } from '@ui/components/create-publication'
import { MessengerSelectors, sendMessage } from '@ui/modules/messenger/store/messenger.slice'
import { useDispatch, useSelector } from 'react-redux'
import { cn } from './cn'

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
  const dispatch = useDispatch()
  const currentDialogId = useSelector(MessengerSelectors.selectCurrentDialogId)
  const selectUser = useSelector(MessengerSelectors.selectTargetNewUserToDialog)


  const handleSubmit = async (newMessage: CreatePublicationContextProps) => {
    if (!currentDialogId && !selectUser) {
      console.error('No dialog or user selected')
      return
    }

    const messageData = {
      text: newMessage.text,
      participants: selectUser ? [selectUser.id] : undefined,
      media: newMessage.media ? await Promise.all(newMessage.media.map(fileToBase64)) : undefined,
      voices: newMessage.voices ? await Promise.all(newMessage.voices.map(fileToBase64)) : undefined,
      videos: newMessage.videos ? await Promise.all(newMessage.videos.map(fileToBase64)) : undefined,
    }
    dispatch(sendMessage(currentDialogId, messageData))
  }

  return (
    <CreatePublication
      className={cn('CreateMessage')}
      onSubmit={handleSubmit}
    />
  )
}
