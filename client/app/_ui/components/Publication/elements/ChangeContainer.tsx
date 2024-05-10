import { cn } from '../cn'

interface AuthorProps {
  autor?: { name: string }
}
export function ChangeContainer(props: AuthorProps) {
  const { autor } = props
  return <div className={cn('ChangeContainer')}>ChangeContainer</div>
}
