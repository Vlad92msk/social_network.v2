import { orderBy } from 'lodash'
import { Spinner } from '@ui/common/Spinner'
import { cn } from './cn'
import { Message } from './Messege'
import { useMessageStore } from '../../../../_providers/message/message.provider'

interface BodyProps {

}

export function Body(props: BodyProps) {
  const { apiError, apiStatus } = useMessageStore((store) => store.getCurrentDialog())
  const messages = useMessageStore((store) => {
    const m = store.getCurrentDialog().apiData?.messages?.map((msg, index, array) => ({
      ...msg,
      forwardMsg: array.find(({ id }) => `dialog-message-${id}` === msg.forwardMessageId),
    }))
    return orderBy(m, (value) => value.dateCreated, 'asc')
  })

  console.log('messages', messages)

  if (apiStatus) return <Spinner />
  if (apiError) return <div>Error</div>

  return (
    <div className={cn()}>
      {messages?.map((msg) => <Message key={msg.id} message={msg} />)}
    </div>
  )
}
