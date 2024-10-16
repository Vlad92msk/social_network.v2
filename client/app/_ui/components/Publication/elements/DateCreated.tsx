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

  return (
    <Text className={cn('DateCreated')} fs="10" letterSpacing={0.18} nowrap>
      {dateUpdate && !isNull(dateUpdate) ? `${format(new Date(dateUpdate), 'HH:mm', { locale: ru })} (изменено)`
        : (
          dateCreated ? `${format(new Date(dateCreated), 'HH:mm', { locale: ru })}` : null
        )}
    </Text>
  )
}
