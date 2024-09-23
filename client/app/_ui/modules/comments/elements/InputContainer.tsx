import { useState } from 'react'
import { Button } from '@ui/common/Button'
import { Icon } from '@ui/common/Icon'
import { TextAreaEmoji } from '@ui/common/Input'
import { cn } from '../cn'

interface ButtonSubmitProps {
  onClose?: VoidFunction
  onSubmit: (comment: string) => void
}

export function InputContainer(props: ButtonSubmitProps) {
  const { onClose, onSubmit } = props
  const [t, setT] = useState('')
  return (
    <div className={cn('InputContainer')}>
      <TextAreaEmoji
        className={cn('AddCommentInput')}
        placeholder="Комментарий"
        value={t}
        onValueChange={(value) => setT(value)}
      />
      <div className={cn('SubmitActions')}>
        <Button className={cn('SubmitButton')} onClick={onClose}>
          <Icon name="close" />
        </Button>
        <Button
          className={cn('SubmitButton')}
          disabled={!t.length}
          onClick={() => {
            if (t.length) {
              onSubmit(t)
              setT('')
            }
          }}
        >
          <Icon name="send" />
        </Button>
      </div>
    </div>
  )
}
