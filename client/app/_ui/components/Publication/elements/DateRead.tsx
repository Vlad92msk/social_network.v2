import { isPast } from 'date-fns'
import { IconBase } from '@ui/base/IconBase'
import { cn } from '../cn'

interface DateDeliveryProps {
  dateDeliver: Date
  dateRead: Date
}
export function DateRead(props: DateDeliveryProps) {
  const { dateDeliver, dateRead } = props
  return (
    <div className={cn('DateRead')}>
      {
        (dateDeliver && dateRead) && (
          <IconBase name={isPast(dateDeliver) ? 'check' : 'checkmark'} className={cn('DateReadIcon', { readable: isPast(dateRead) })} />
        )
      }
    </div>
  )
}
