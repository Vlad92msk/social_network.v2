import { cn } from './cn'
import { useDialogStore } from '../../../../_providers/dialogSelected'

interface BodyProps {

}

export function Body(props: BodyProps) {
  const dialogs = useDialogStore((store) => store.getCurrentDialog())
  console.log('dialogs', dialogs)
  return (
    <div className={cn()}>
      dialog
      {/* {messages.map((msg) => <Message message={msg} key={msg.id} />)} */}
    </div>
  )
}
