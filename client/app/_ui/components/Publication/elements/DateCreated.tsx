import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { TextCommon } from '@ui/common/TextCommon'
import { cn } from '../cn'

interface DateCreatedProps {
  dateCreated: Date
}
export function DateCreated(props: DateCreatedProps) {
  const { dateCreated } = props
  return (
    <TextCommon className={cn('DateCreated')} fs="12" letterSpacing={0.18}>
      {dateCreated && format(dateCreated, 'HH:mm', { locale: ru })}
    </TextCommon>
  )
}
