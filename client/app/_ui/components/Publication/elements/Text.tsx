import { TextCommon } from '@ui/common/TextCommon'
import { cn } from '../cn'

interface TextProps {
 text: string
}
export function Text(props: TextProps) {
  const { text } = props
  return (
    <TextCommon className={cn('Text')} fs="14">
      {text}
    </TextCommon>
  )
}
