import { Spinner } from '@ui/common/Spinner'
import { MessengerSelectors } from '@ui/modules/messenger/store/messenger.slice'
import { useSelector } from 'react-redux'
import { cn } from './cn'
import { Message } from './Messege'
import { dialogsApi } from '../../../../../../../../store/api'

interface BodyProps {

}

export function Body(props: BodyProps) {
  dialogsApi.useListenForNewDialogsQuery()

  const currentDialogId = useSelector(MessengerSelectors.selectСurrentDialogId)
  console.log('selectCurrentDialogIds', currentDialogId)


  const { messages, isLoading } = dialogsApi.useFindOneQuery(
    { id: currentDialogId },
    {
      skip: !currentDialogId,
      selectFromResult: ({ data, isLoading: isLoadingApi }) => {
        console.log('open_dialog', data)
        return ({
          messages: data?.messages ?? [],
          isLoading: isLoadingApi,
        })
      },
    },
  )
console.log('messages', messages)
  if (isLoading) return <Spinner />

  return (
    <div className={cn()}>
      {messages.map((msg) => <Message key={msg.id} message={msg} />)}
    </div>
  )
}
