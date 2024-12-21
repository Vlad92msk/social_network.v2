import { CreatePublication, CreatePublicationContextProps } from '@ui/components/create-publication'
import { MessengerThunkActions } from '@ui/modules/messenger/store/actions'
import { MessengerSelectors } from '@ui/modules/messenger/store/selectors'
import { useDispatch, useSelector } from 'react-redux'
import { dialogsApi } from '../../../../../../../../store/api'
import { cn } from './cn'

export function Footer() {
  const dispatch = useDispatch()
  const currentDialogId = useSelector(MessengerSelectors.selectCurrentDialogId)
  const selectUser = useSelector(MessengerSelectors.selectTargetNewUserToDialog)

  const [submit, { isLoading: isSubmitting }] = dialogsApi.useSendMessageMutation()

  const handleSubmit = (createdMessage: CreatePublicationContextProps) => {
    if (!currentDialogId && !selectUser) {
      console.error('No dialog or user selected')
      return
    }

    const formData = new FormData()

    formData.append('text', createdMessage.text)

    // Добавление участников в FormData как массив чисел
    if (selectUser) {
      formData.append('participants[]', selectUser.id.toString())
    }

    if (createdMessage.media) {
      Object.values(createdMessage.media).flat().forEach((file) => {
        formData.append('media', file.blob, file.name)
      })
    }

    if (createdMessage.voices) {
      createdMessage.voices.forEach((file) => {
        formData.append('voices', file.blob, file.name)
      })
    }

    if (createdMessage.videos) {
      createdMessage.videos.forEach((file) => {
        formData.append('videos', file.blob, file.name)
      })
    }

    // @ts-ignore
    submit({ dialog_id: currentDialogId || 'new', body: formData })
  }

  return (
    <CreatePublication
      className={cn('CreateMessage')}
      onSubmit={handleSubmit}
      onStartTyping={() => {
        dispatch(MessengerThunkActions.startTyping(currentDialogId))
      }}
      onStopTyping={() => {
        dispatch(MessengerThunkActions.stopTyping(currentDialogId))
      }}
    />
  )
}
