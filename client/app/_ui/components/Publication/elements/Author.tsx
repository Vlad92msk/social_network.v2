import { cn } from '../cn'

interface AuthorProps {
  autor?: { name: string }
}
export function Author(props: AuthorProps) {
  const { autor } = props
  return <div className={cn('Author')}>Author</div>
}
