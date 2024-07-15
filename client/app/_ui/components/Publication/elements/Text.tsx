import { Text as TextComponent } from 'app/_ui/common/Text'
import { cn } from '../cn'

interface TextProps {
 text: string
}
export function Text(props: TextProps) {
  const { text } = props
  return (
    <TextComponent className={cn('Text')} fs="14">
      {text}
    </TextComponent>
  )
}
