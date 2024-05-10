import { cn } from '../cn'

interface TextProps {
  autor?: { name: string }
}
export function Text(props: TextProps) {
  const { autor } = props
  return <div className={cn('Text')}>Text</div>
}
