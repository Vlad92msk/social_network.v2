import { cn } from './cn'
import { Message } from './Messege'
import { useDialogStore } from '../../../../_providers/dialogSelected'

interface BodyProps {

}

export function Body(props: BodyProps) {
  const messages = useDialogStore((store) => store.chatMessages)
  const dialogs = useDialogStore((store) => store.getDialogs())
  console.log('dialogs', dialogs)
  return (
    <div className={cn()}>
      {messages.map((msg) => <Message message={msg} key={msg.id} />)}
    </div>
  )
}
