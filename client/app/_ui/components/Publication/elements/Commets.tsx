import { cn } from '../cn'

interface CommetsProps {
  autor?: { name: string }
}
export function Commets(props: CommetsProps) {
  const { autor } = props
  return <div className={cn('Commets')}>Commets</div>
}
