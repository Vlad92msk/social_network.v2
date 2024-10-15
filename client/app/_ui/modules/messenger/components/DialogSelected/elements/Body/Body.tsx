import { useSelector } from 'react-redux'
import { Spinner } from '@ui/common/Spinner'
import { MessengerSelectors } from '@ui/modules/messenger/store/selectors'
import { cn } from './cn'
import { Message } from './Messege'
import { messagesApi } from '../../../../../../../../store/api'

interface BodyProps {

}

export function Body(props: BodyProps) {
  const dialogId = useSelector(MessengerSelectors.selectCurrentDialogId)
  const { data: messages, isLoading } = messagesApi.useFindAllQuery(
    { dialog_id: dialogId },
    { skip: !dialogId },
  )

  console.log('messages', messages)
  return (
    <div className={cn()}>
      {isLoading ? (<Spinner />) : (
        messages?.map((msg) => <Message key={msg.id} message={msg} />)
      )}
    </div>
  )
}
