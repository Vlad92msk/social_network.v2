import { usePublicationCtxSelect } from '@ui/components/Publication'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { isNull } from 'lodash'
import { Text } from 'app/_ui/common/Text'
import { cn } from '../cn'

interface DateCreatedProps {
  dateCreated?: any
  dateUpdate?: any
}

export function DateCreated(props: DateCreatedProps) {
  const { dateCreated } = props
  const dateUpdate = usePublicationCtxSelect((store) => store.dateChanged)
console.log('dateUpdate', dateUpdate)
console.log('dateCreated', dateCreated)
  return (
    <Text className={cn('DateCreated')} fs="12" letterSpacing={0.18}>
      {dateUpdate && !isNull(dateUpdate) ? `${format(dateUpdate, 'HH:mm', { locale: ru })} (изменено)`
        : (
          dateCreated ? `${format(dateCreated, 'HH:mm', { locale: ru })}` : null
        )}
    </Text>
  )
}
