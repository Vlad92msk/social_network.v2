import { useRef } from 'react'
import { RichTextEditor } from '@ui/common/Input'
import { classNames, setImmutable } from '@utils/others'
import { cn } from '../cn'
import { useReset } from '../hooks'
import { usePublicationCtxSelect, usePublicationCtxUpdate } from '../Publication'

interface TextProps {
  className?: string
  text?: string
}

export function Text(props: TextProps) {
  const { className, text } = props

  const isChangeActive = usePublicationCtxSelect((store) => (store.isChangeActive))
  const handleSetChangeActive = usePublicationCtxUpdate()
  const resetKeyRef = useRef(0)

  useReset('text', text, () => {
    resetKeyRef.current += 1 // Increment key to force re-mount
  })

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
            s: controls
          }))
        }}
        className={cn('TextContent')}
        key={resetKeyRef.current}
        initialValue={text}
        readOnly={!isChangeActive}
        onValueChange={(newText) => {
          handleSetChangeActive((ctx) => setImmutable(ctx, 'changeState.text', newText))
        }}
      />
    </div>
  )
}
