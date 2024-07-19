import { TextArea } from '@ui/common/Input'
import { useReset } from '../hooks'
import { classNames, setImmutable } from '@utils/others'
import { Text as TextComponent } from 'app/_ui/common/Text'
import { useState } from 'react'
import { cn } from '../cn'
import { usePublicationCtxSelect, usePublicationCtxUpdate } from '../Publication'

interface TextProps {
  className?: string
  text?: string
}
export function Text(props: TextProps) {
  const { className, text } = props
  const [getText, setText] = useState(text)
  const isChangeActive = usePublicationCtxSelect((store) => (store.isChangeActive))
  const handleSetChangeActive = usePublicationCtxUpdate()

  useReset('text', text, setText)

  return (
    <div className={classNames(cn('Text'), className)}>
      {
        isChangeActive ? (
          <TextArea
            fs="14"
            value={getText}
            onChange={(event) => {
              const newText = event.target.value
              handleSetChangeActive((ctx) => setImmutable(ctx, 'changeState.text', newText))
              setText(newText)
            }}
            className={(cn('TextContent'))}
          />
        ) : (
          <TextComponent
            fs="14"
            className={(cn('TextContent'))}
          >
            {getText}
          </TextComponent>
        )
      }
    </div>
  )
}
