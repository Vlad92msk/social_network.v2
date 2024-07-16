import { Spinner } from '@ui/common/Spinner'
import { cn } from './cn'
import { Message } from './Messege'
import { useMessageStore } from '../../../../_providers/message/message.provider'

interface BodyProps {

}

export function Body(props: BodyProps) {
  const { apiError, apiStatus } = useMessageStore((store) => store.getCurrentDialog())
  const messages = useMessageStore((store) => store.getCurrentDialog().apiData?.messages)

  if (apiStatus) return <Spinner />
  if (apiError) return <div>Error</div>

  return (
    <div className={cn()}>
      {messages?.map((msg) => <Message message={msg} key={msg.id} />)}
    </div>
  )
}
