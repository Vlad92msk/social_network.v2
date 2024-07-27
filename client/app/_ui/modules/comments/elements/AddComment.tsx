import { TextAreaEmoji } from '@ui/common/Input'
import { cn } from '../cn'
import { useState } from 'react'

export const AddComment = () => {
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
