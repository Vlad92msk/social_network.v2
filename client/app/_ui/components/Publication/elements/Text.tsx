import { RichTextEditor } from '@ui/common/Input'
import { editorStateFromString, editorStateToPlainText } from '@ui/common/Input/hooks'
import { LinkPreview } from '@ui/common/LinkPreview'
import { isValidUrl } from '@ui/common/LinkPreview/hooks'
import { classNames, setImmutable } from '@utils/others'
import { useEffect, useState } from 'react'
import { cn } from '../cn'
import { useReset } from '../hooks'
import { usePublicationCtxSelect, usePublicationCtxUpdate } from '../Publication'

interface TextProps {
  className?: string
  text?: string
}

// Функция для поиска URL в тексте
const findUrlInText = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const matches = text.match(urlRegex)
  return matches ? matches[0] : null
}

export function Text(props: TextProps) {
  const { className, text } = props

  const isChangeActive = usePublicationCtxSelect((store) => (store.isChangeActive))
  const handleSetChangeActive = usePublicationCtxUpdate()

  const [link, setLink] = useState(null)

  useEffect(() => {
    if (text) {
      const t = editorStateToPlainText(editorStateFromString(text))
      const foundLink = findUrlInText(t)
      if (foundLink !== link) {
        setLink(isValidUrl(foundLink) ? foundLink : null)
      }
    }
  }, [link, text])

  useReset('text', text)

  console.log('link', link)
  return (
    <div
      className={classNames(cn('Text'), className)}
      onContextMenu={(event) => {
        event.stopPropagation()
      }}
    >
      <RichTextEditor
        onInit={(controls) => {
          handleSetChangeActive(() => ({
            s: controls,
          }))
        }}
        className={cn('TextContent')}
        initialValue={text}
        readOnly={!isChangeActive}
        onValueChange={(newText) => {
          handleSetChangeActive((ctx) => setImmutable(ctx, 'changeState.text', newText))
        }}
      />
      {link && <LinkPreview url={link} />}
    </div>
  )
}
