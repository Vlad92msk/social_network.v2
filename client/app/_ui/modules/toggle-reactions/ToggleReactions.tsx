import { mapValues, merge } from 'lodash'
import { useCallback, useState } from 'react'
import { Icon } from '@ui/common/Icon'
import { Text } from '@ui/common/Text'
import { classNames, makeCn } from '@utils/others'
import style from './ToggleReactions.module.scss'
import { PostResponseDto } from '../../../../../swagger/posts/interfaces-posts'

import { reactionsApi } from '../../../../store/api'

export const cn = makeCn('ToggleReactions', style)

export interface ToggleReactionsProps {
  className?: string
  onClick?: (emoji: { name: string }) => void
  reactions?: PostResponseDto['reaction_info']
  entity_type: 'post' | 'media' | 'message' | 'comment'
  entity_id: string
}

const DEFAULT_REACTIONS = ['thumbsup', 'thumbsdown'] as const
type ReactionType = typeof DEFAULT_REACTIONS[number]

export function ToggleReactions(props: ToggleReactionsProps) {
  const { className, onClick, entity_id, entity_type, reactions: initialReactions } = props
  const [onToggleReaction] = reactionsApi.useCreateMutation()

  const [reactions, setReactions] = useState(() => {
    const initialCounts = DEFAULT_REACTIONS.reduce(
      (acc, reaction) => ({ ...acc, [reaction]: 0 }),
      {},
    )

    return ({
      counts: merge({}, initialCounts, initialReactions?.counts),
      myReaction: initialReactions?.my_reaction || null,
    })
  })

  const handleReactionClick = useCallback(
    (name: ReactionType) => {
      setReactions((prev) => {
        const isRemoving = prev.myReaction === name
        const newMyReaction = isRemoving ? null : name

        const newCounts = mapValues(prev.counts, (count, key) => {
          if (key === name) return isRemoving ? Math.max(0, count - 1) : count + 1
          if (key === prev.myReaction) return Math.max(0, count - 1)
          return count
        })

        return {
          counts: newCounts,
          myReaction: newMyReaction,
        }
      })

      onClick?.({ name })
      onToggleReaction({
        entity_type,
        entity_id,
        body: { name },
      })
    },
    [entity_id, entity_type, onClick, onToggleReaction],
  )

  return (
    <div className={classNames(cn(), className)}>
      {DEFAULT_REACTIONS.map((reaction) => (
        <button
          key={reaction}
          className={cn('ButtonBox', { active: reactions.myReaction === reaction })}
          onClick={() => handleReactionClick(reaction)}
        >
          <Icon name={reaction === 'thumbsup' ? 'thump-up' : 'thumb-down'} />
          <Text fs="12" letterSpacing={0.18}>{reactions.counts[reaction]}</Text>
        </button>
      ))}
    </div>
  )
}
