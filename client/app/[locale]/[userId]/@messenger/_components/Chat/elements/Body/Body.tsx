import { cn } from './cn'
import { Message } from './Messege'
import { useChatStore } from '../../../../_providers/chat'

interface BodyProps {

}

export function Body(props: BodyProps) {
  const messages = useChatStore((store) => store.chatMessages)

  return (
    <div className={cn()}>
      {messages.map((msg) => <Message message={msg} key={msg.id} />)}
    </div>
  )
}
