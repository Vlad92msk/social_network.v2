import { useSelector } from 'react-redux'
import { cn } from './cn'
import { Message } from './Messege'
import { MessengerSelectors } from '../../../../store/messenger.slice'

interface BodyProps {

}

export function Body(props: BodyProps) {
  const { data: messages } = useSelector(MessengerSelectors.selectCurrentDialogMessages)

  return (
    <div className={cn()}>
      {messages.map((msg) => <Message key={msg.id} message={msg} />)}
    </div>
  )
}
