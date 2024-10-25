import { useCallback, useEffect, useState } from 'react'
import { RichTextEditor } from '@ui/common/Input'
import { LinkPreview } from '@ui/common/LinkPreview'
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

  useEffect(() => {
    if (!text) {
      setLink(null)
    }
  }, [text])

  const handleRemoveLink = useCallback(() => {
    if (link) {
      const newText = text.replace(link, '').trim()
      update((ctx) => setImmutable(ctx, 'text', newText))
      setLink(null)
    }
  }, [link, text, update])

  return (
    <div className={cn('AddCommentContainer')}>
      {link && <LinkPreview url={link} onRemove={handleRemoveLink} />}

      <RichTextEditor
        className={cn('AddCommentInput')}
        placeholder={placeholder}
        initialValue={text}
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
    </div>
  )
}
