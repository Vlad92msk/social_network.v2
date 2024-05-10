import { cn } from '../cn'

interface EmojiesProps {
  autor?: { name: string }
}
export function Emojies(props: EmojiesProps) {
  const { autor } = props
  return <div className={cn('Emojies')}>Emojies</div>
}
