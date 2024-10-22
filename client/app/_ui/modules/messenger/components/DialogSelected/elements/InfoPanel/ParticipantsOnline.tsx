import { useProfile } from '@hooks'
import { useSelector } from 'react-redux'
import { Button } from '@ui/common/Button'
import { Popover } from '@ui/common/Popover'
import { Text } from '@ui/common/Text'
import { Listitem } from '@ui/modules/messenger/components/DialogsDrawerBar/elements/Listitem'
import { MessengerSelectors } from '@ui/modules/messenger/store/selectors'
import { cn } from './cn'
import { dialogsApi } from '../../../../../../../../store/api'

export function ParticipantsOnline() {
  const { profile } = useProfile()
  const currentDialog = useSelector(MessengerSelectors.selectCurrentDialog)
  const active = useSelector(MessengerSelectors.selectCurrentDialogActiveParticipants)

  const dialogId = useSelector(MessengerSelectors.selectCurrentDialogId)
  const [onUpdate] = dialogsApi.useUpdateMutation()

  if (!currentDialog) return null
  return (
    <div className={cn('ParticipantsOnline')}>
      <Popover
        content={(
          <div className={cn('ParticipantsOnlineList')}>
            {currentDialog.participants.map(({
              id,
              profile_image,
              name,
            }) => (
              <Listitem
                key={id}
                contactName={name}
                img={profile_image}
                actions={(
                  <Button
                    disabled={id === profile?.user_info.id}
                    onClick={(event) => {
                      event.stopPropagation()
                      onUpdate({
                        id: dialogId,
                        body: { remove_participants: [id] },
                      })
                    }}
                  >
                    <Text fs="12">Удалить</Text>
                  </Button>
                )}
              />
            ))}
          </div>
        )}
        trigger="click"
        strategy="fixed"
        closeOnOutsideClick
        placement="left"
      >
        <Text fs="12">{`Участников ${currentDialog.participants.length}`}</Text>
      </Popover>
      <Text fs="12">{`В сети ${active.length - 1}`}</Text>
    </div>
  )
}
