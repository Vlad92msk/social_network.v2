import { cn } from '../cn'

interface MediaContainerProps {
  autor?: { name: string }
}
export function MediaContainer(props: MediaContainerProps) {
  const { autor } = props
  return <div className={cn('MediaContainer')}>MediaContainer</div>
}
