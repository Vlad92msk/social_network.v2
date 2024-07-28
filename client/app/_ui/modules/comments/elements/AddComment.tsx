import { useState } from 'react'
import { TextAreaEmoji } from '@ui/common/Input'
import { cn } from '../cn'

export function AddComment() {
  const [t, setT] = useState('')

  return (
    <TextAreaEmoji
      className={cn('AddCommentInput')}
      placeholder="Комментарий"
      value={t}
      onValueChange={(value) => setT(value)}
    />
  )
}
