import { useSelector } from 'react-redux'
import { Text } from '@ui/common/Text'
import { cn } from './cn'
import { dialogsApi } from '../../../../../../../../store/api'
import { MessengerSelectors } from '../../../../store/selectors'

export function SwitchDialogType() {
  const dialogId = useSelector(MessengerSelectors.selectCurrentDialogId)
  const dialog = useSelector(MessengerSelectors.selectCurrentDialog)

  const [onUpdate] = dialogsApi.useUpdateMutation()

  if (!dialog) return null
  return (
    <div className={cn('SwitchDialogType')}>
      <input
        type="radio"
        id="type1"
        name="type"
        value="public"
        checked={dialog.type === 'public'}
        onChange={(e) => {
          const newType = e.target.value
          onUpdate({ id: dialogId, body: { type: newType } })
        }}
      />
      {/* @ts-ignore */}
      <Text as="label" htmlFor="type1" fs="10" uppercase letterSpacing={0.1}>Публичный</Text>

      <input
        type="radio"
        id="type2"
        name="type"
        value="private"
        checked={dialog.type === 'private'}
        onChange={(e) => {
          const newType = e.target.value
          onUpdate({ id: dialogId, body: { type: newType } })
        }}
      />
      {/* @ts-ignore */}
      <Text as="label" htmlFor="type2" fs="10" uppercase letterSpacing={0.1}>Приватный</Text>
    </div>
  )
}
