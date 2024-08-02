import { createZustandContext } from '@utils/client'
import { cn } from './cn'
import {
  AddAttachmentsList, AddVideoList,
  AddVoicesList, ButtonAddVideo,
  ButtonAddVoice,
  ButtonAttachment,
  ButtonReset,
  ButtonSubmit,
  InputText,
} from './components'
import { PublicationDTO } from '../../../types/publicationDTO'

export const SUBMIT_PROPS = ['text', 'emojis', 'media', 'voices', 'videos']

interface CreatePublicationContextProps extends Pick<PublicationDTO, 'text' | 'emojis' | 'media' | 'voices' | 'videos'>{
}

export const initialState: CreatePublicationContextProps = {
  media: undefined,
  text: '',
  emojis: undefined,
  voices: undefined,
  videos: undefined,
}

export const {
  contextZustand,
  useZustandSelector: useCreatePublicationCtxSelect,
  useZustandDispatch: useCreatePublicationCtxUpdate,
} = createZustandContext(initialState)

export interface CreatePublicationProps {
  onSubmit: (data?: CreatePublicationContextProps) => void
  onReset?: VoidFunction
}

export const CreatePublication = contextZustand<CreatePublicationProps, CreatePublicationContextProps>((props) => {
  const { onSubmit, onReset } = props

  return (
    <div className={cn()}>
      <ButtonAddVoice />
      <ButtonAddVideo />
      <AddVideoList />
      <AddVoicesList />
      <AddAttachmentsList />
      <div className={cn('ContentContainer')}>
        <ButtonAttachment />
        <InputText placeholder="Введите текст" />
      </div>
      <div className={cn('SubmitActionsContainer')}>
        <ButtonSubmit onSubmit={onSubmit} />
        <ButtonReset onReset={onReset} />
      </div>
    </div>
  )
})
