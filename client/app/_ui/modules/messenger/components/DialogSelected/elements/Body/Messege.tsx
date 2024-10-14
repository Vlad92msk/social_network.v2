import { useProfile } from '@hooks'
import { Publication } from '@ui/components/Publication'
import { MessengerSelectors } from '@ui/modules/messenger/store/selectors'
import { selectCurrentDialogId } from '@ui/modules/messenger/store/selectors/messenger.selectors'
import { get, groupBy } from 'lodash'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { MessageEntity } from '../../../../../../../../../swagger/messages/interfaces-messages'
import { dialogsApi, postsApi } from '../../../../../../../../store/api'
import { cn } from './cn'

interface MessageProps {
  message: MessageEntity
}

export function Message(props: MessageProps) {
  const { message } = props
  const { profile } = useProfile()
  const dialogId = useSelector(MessengerSelectors.selectCurrentDialogId)
  const gropedMediaByType = useMemo(() => groupBy(message.media, 'meta.type'), [message.media])

  const [onRemove] = postsApi.useRemoveMutation()
  const [onUpdate] = postsApi.useUpdateMutation()
  const [onPin] = dialogsApi.useAddFixedMessageMutation()

  const from = profile?.user_info.id === message.author?.id ? 'me' : 'other'
  return (
    <div
      id={`${message.id}`}
      className={cn('Message', { from })}
    >
      <Publication
        contextProps={{ id: message.id, dateChanged: message.date_updated }}
        className={cn('MessageItem')}
        authorPosition="right"
        onRead={() => {
          // const newDate = subMinutes(new Date(), 1)
          // console.log('read', publicationId, newDate)
          // handleUpdateMsg({ id: publicationId, dateRead: newDate, dateDeliver: newDate })
        }}
      >
        <Publication.ChangeContainer
        // Обновить пост
          onSubmit={(result) => {
            const { removeMediaIds: { video, voices, other, image, audio }, media, id } = result
            console.log('result', result)
            const updatePost: Parameters<typeof onUpdate>[0] = {
              id,
              body: {
                remove_media_ids: [...image, ...audio, ...other],
                remove_video_ids: video,
                remove_voice_ids: voices,
              },
            }
            if (result?.text) {
              updatePost.body.text = result.text
            }
            console.log('updatePost', updatePost)
            // onUpdate(updatePost)
          }}
        // Удалить пост
          onRemove={(id) => {
            // onRemove({ id })
          }}
        // Закрепить пост
          onPin={(id) => {
            onPin({ id: dialogId, message_id: id })
          }}
        />
        <Publication.MediaContainer
          voices={message.voices || []}
          video={message.videos || []}
          audio={get(gropedMediaByType, 'audio')}
          image={get(gropedMediaByType, 'image', [])}
          other={get(gropedMediaByType, 'other', [])}
        />
        <Publication.Text className={cn('MessageItemText')} text={message.text} />
        {/* <Publication.Emojies */}
        {/*   reactions={post.reaction_info} */}
        {/*   entity_id={post.id} */}
        {/*   entity_type="post" */}
        {/* /> */}
        <Publication.DateCreated dateCreated={message.date_created} />
      </Publication>
    </div>
  )
}
