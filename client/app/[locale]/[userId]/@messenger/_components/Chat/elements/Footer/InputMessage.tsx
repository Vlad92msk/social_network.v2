import { TextAreaCommon } from '@ui/common/InputCommon'
import { cn } from './cn'

export function InputMessage() {
  // return <Textarea className={cn('InputMessage')} />
  return <TextAreaCommon className={cn('InputMessage')} placeholder="Введите сообщение" />
}
