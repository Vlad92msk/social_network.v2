import { useScrollToElement } from '@hooks'
import { Button } from '@ui/common/Button'
import { Text } from '@ui/common/Text'
import { classNames } from '@utils/others'
import { cn } from '../cn'

interface ResponseProps {
  className?: string
  /**
   * ID того сообщения на которое текущее сообщение отвечает
   */
  quoteMessageId?: string
  /**
   * ID сообщения, которое было переслано
   */
  forwardMessageId?: string
  name?: string
  text?: string
}

export function Response(props: ResponseProps) {
  const { className, forwardMessageId, quoteMessageId, name, text } = props

  const scrollToComment = useScrollToElement({
    behavior: 'smooth',
  })

  if (!(forwardMessageId || quoteMessageId)) return null
  return (
    <Button
      className={classNames(cn('Response'), className)}
      onClick={() => {
        scrollToComment({
          targetElementId: forwardMessageId || quoteMessageId,
        })
      }}
    >
      <Text fs="12" weight="bold">{name}</Text>
      <Text fs="12">{text}</Text>
    </Button>
  )
}
