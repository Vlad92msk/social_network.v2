import { ReactNode } from 'react'
import { cn } from '../cn'

interface AuthorProps {
  authorComponent: ReactNode
}
export function Author(props: AuthorProps) {
  const { authorComponent } = props
  return (
    <div className={cn('Author')}>
      {authorComponent}
    </div>
  )
}
