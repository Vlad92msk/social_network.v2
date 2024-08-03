import { Text } from '@ui/common/Text'
import { createZustandContext } from '@utils/client'
import { classNames } from '@utils/others'
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

export interface CreatePublicationContextProps extends Pick<PublicationDTO, 'text' | 'emojis' | 'media' | 'voices' | 'videos'>{
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
  title?: string
  className?: string
}

export const CreatePublication = contextZustand<CreatePublicationProps, CreatePublicationContextProps>((props) => {
  const {
    className,
    onSubmit,
    onReset,
    title
  } = props

  return (
    <div className={classNames(className, cn())}>
      <Text uppercase letterSpacing={0.08} fs="18" weight="light">{title}</Text>
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
