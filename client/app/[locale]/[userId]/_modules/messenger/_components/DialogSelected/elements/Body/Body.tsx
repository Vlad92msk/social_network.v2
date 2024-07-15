import { Spinner } from '@ui/common/Spinner'
import { cn } from './cn'
import { Message } from './Messege'
import { useDialogStore } from '../../../../_providers/dialogSelected'

interface BodyProps {

}

export function Body(props: BodyProps) {
  const { apiError, apiStatus } = useDialogStore((store) => store.getCurrentDialog())
  const messages = useDialogStore((store) => store.getCurrentDialog().apiData?.messages)

  if (apiStatus) return <Spinner />
  if (apiError) return <div>Error</div>

  return (
    <div className={cn()}>
      {messages?.map((msg) => <Message message={msg} key={msg.id} />)}
    </div>
  )
}
