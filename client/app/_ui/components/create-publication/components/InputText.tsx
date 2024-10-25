import { useState } from 'react'
import { TextAreaEmoji } from '@ui/common/Input'
import { LinkPreviewComponent } from '@ui/common/LinkPreview'
import { isValidUrl } from '@ui/common/LinkPreview/hooks'
import { setImmutable } from '@utils/others'
import { cn } from '../cn'
import { useCreatePublicationCtxSelect, useCreatePublicationCtxUpdate } from '../CreatePublication'

// Функция для поиска URL в тексте
const findUrlInText = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const matches = text.match(urlRegex)
  return matches ? matches[0] : null
}

interface InputTextProps {
  placeholder: string
  onStartTyping?: VoidFunction
  onStopTyping?: VoidFunction
}

export function InputText(props: InputTextProps) {
  const { placeholder, onStopTyping, onStartTyping } = props
  const text = useCreatePublicationCtxSelect((ctx) => ctx.text)
  const update = useCreatePublicationCtxUpdate()
  const [link, setLink] = useState(null)

  return (
    <>
      {link && <LinkPreviewComponent url={link} />}

      <TextAreaEmoji
        className={cn('AddCommentInput')}
        placeholder={placeholder}
        value={text}
        onStartTyping={onStartTyping}
        onStopTyping={onStopTyping}
        onValueChange={(value) => {
          update((ctx) => setImmutable(ctx, 'text', value))
          const foundLink = findUrlInText(value)
          if (foundLink !== link) {
            setLink(isValidUrl(foundLink) ? foundLink : null)
          }
        }}
      />
    </>
  )
}
