import { cn } from '../cn'

interface DateCreatedProps {
  autor?: { name: string }
}
export function DateCreated(props: DateCreatedProps) {
  const { autor } = props
  return <div className={cn('DateCreated')}>DateCreated</div>
}
