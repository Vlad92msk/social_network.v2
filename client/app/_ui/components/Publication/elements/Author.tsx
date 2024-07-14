import { ImageCommon } from '@ui/common/ImageCommon'
import { cn } from '../cn'

interface AuthorProps {
  position?: 'left' | 'right'
  autor?: { name: string }
}
export function Author(props: AuthorProps) {
  const { autor, position = 'right' } = props
  return (
    <div className={cn('Author', { position })}>
      <ImageCommon src="base/me" height={40} width={40} alt="Author" />
    </div>
  )
}
