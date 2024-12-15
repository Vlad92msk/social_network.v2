import { Image } from '@ui/common/Image'
import { classNames } from '@utils/others'
import { cn } from './cn'

interface LocalPreviewProps {
  className?: string
  src?: string
  name?: string
}

export function Picture(props: LocalPreviewProps) {
  const { className, src, name } = props

  return (
    <div className={classNames(cn('Picture'), className)}>
      <Image src={src || ''} alt={name || ''} width={125} height={50} />
    </div>
  )
}
