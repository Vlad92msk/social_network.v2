import { Spinner } from '@ui/common/Spinner'
import { cn } from './cn'
import { Message } from './Messege'
import { dialogsApi } from '../../../../../../../../store/api'
import { useMessageStore } from '../../../../store'

interface BodyProps {

}

export function Body(props: BodyProps) {
  const openDialogId = useMessageStore((store) => store.openDialogId)

  const { messages, isLoading } = dialogsApi.useFindOneQuery(
    { id: openDialogId },
    {
      skip: !Boolean(openDialogId?.length),
      selectFromResult: ({ data, isLoading }) => ({
        messages: data?.messages ?? [],
        isLoading,
      }),
    },
  )

  if (isLoading) return <Spinner />

  return (
    <div className={cn()}>
      {messages.map((msg) => <Message key={msg.id} message={msg} />)}
    </div>
  )
}
