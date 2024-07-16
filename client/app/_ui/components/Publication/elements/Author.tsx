import { Image } from 'app/_ui/common/Image'
import { cn } from '../cn'

interface AuthorProps {
  autor?: { name: string }
}
export function Author(props: AuthorProps) {
  const { autor } = props
  return (
    <div className={cn('Author')}>
      <Image src="base/me" height={40} width={40} alt="Author" />
    </div>
  )
}
