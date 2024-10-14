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

export const SUBMIT_PROPS = ['text', 'media', 'voices', 'videos']

export interface MyFile {
  id: string;
  blob: Blob;
  url: string;
  name?: string
}

export interface CreatePublicationContextProps {
  text: string
  media?: MyFile[]
  voices?: MyFile[]
  videos?: MyFile[]
}

export const initialState: CreatePublicationContextProps = {
  media: undefined,
  text: '',
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
  onStartTyping?: VoidFunction
  onStopTyping?: VoidFunction
  title?: string
  className?: string
}

export const CreatePublication = contextZustand<CreatePublicationProps, CreatePublicationContextProps>((props) => {
  const {
    className,
    onSubmit,
    onReset,
    onStartTyping,
    onStopTyping,
    title,
  } = props

  return (
    <div className={classNames(className, cn())}>
      <Text uppercase letterSpacing={0.08} fs="18" weight="light">{title}</Text>
      <AddVideoList />
      <AddVoicesList />
      <AddAttachmentsList />
      <div className={cn('ContentContainer')}>
        <ButtonAttachment />
        <InputText
          onStartTyping={onStartTyping}
          onStopTyping={onStopTyping}
          placeholder="Введите текст"
        />
      </div>
      <div className={cn('SubmitActionsContainer')}>
        <ButtonAddVoice />
        <ButtonAddVideo />
        <ButtonSubmit onSubmit={onSubmit} />
        <ButtonReset onReset={onReset} />
      </div>
    </div>
  )
})
