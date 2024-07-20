import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Text } from 'app/_ui/common/Text'
import { cn } from '../cn'

interface DateCreatedProps {
  dateCreated?: Date
}

export function DateCreated(props: DateCreatedProps) {
  const { dateCreated } = props

  return (
    <Text className={cn('DateCreated')} fs="12" letterSpacing={0.18}>
      {dateCreated && format(dateCreated, 'HH:mm', { locale: ru })}
    </Text>
  )
}
