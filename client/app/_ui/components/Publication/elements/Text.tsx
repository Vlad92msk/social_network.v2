import { classNames } from '@utils/others'
import { Text as TextComponent } from 'app/_ui/common/Text'
import { cn } from '../cn'

interface TextProps {
  text: string
  className?: string
}
export function Text(props: TextProps) {
  const { text, className } = props
  return (
    <TextComponent className={classNames(cn('Text'), className)} fs="14">
      {text}
    </TextComponent>
  )
}
