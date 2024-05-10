import { cn } from '../cn'

interface DateDeliveryProps {
  autor?: { name: string }
}
export function DateDelivery(props: DateDeliveryProps) {
  const { autor } = props
  return <div className={cn('DateDelivery')}>DateDelivery</div>
}
