import { orderBy } from 'lodash'
import { Spinner } from '@ui/common/Spinner'
import { cn } from './cn'
import { Message } from './Messege'
import { useMessageStore } from '../../../../store'

interface BodyProps {

}

export function Body(props: BodyProps) {
  const { apiError, apiStatus } = useMessageStore(({getCurrentDialog}) => getCurrentDialog())
  const messages = useMessageStore(({getCurrentDialog}) => {
    const dialog = getCurrentDialog().apiData
    if (!dialog) return []

    const m = dialog?.messages?.map((msg, index, array) => ({
      ...msg,
      forwardMsg: array.find(({ id }) => `dialog-message-${id}` === msg.forwardMessageId),
    }))
    return orderBy(m, (value) => value.dateCreated, 'asc')
  })


  if (apiStatus) return <Spinner />
  if (apiError) return <div>Error</div>

  return (
  <div className={cn()}>
    {messages.map((msg) => <Message key={msg.id} message={msg} />)}
  </div>
  )
}
