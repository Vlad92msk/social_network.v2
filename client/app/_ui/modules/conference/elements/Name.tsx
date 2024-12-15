import { Text } from '@ui/common/Text'
import { classNames } from '@utils/others'
import { cn } from './cn'

interface LocalPreviewProps {
  className?: string
  name?: string
}

export function Name(props: LocalPreviewProps) {
  const { className, name } = props

  if (!name) return null
  return (
    <Text className={classNames(cn('Name'), className)} fs="12">
      {name}
    </Text>
  )
}
