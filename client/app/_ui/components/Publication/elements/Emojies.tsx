import { mapValues, merge } from 'lodash'
import { useCallback, useState } from 'react'
import { Icon } from 'app/_ui/common/Icon'
import { Text } from 'app/_ui/common/Text'
import { PostResponseDto } from '../../../../../../swagger/posts/interfaces-posts'
import { cn } from '../cn'

interface EmojiesProps {
  onClick?: (emoji: { name: string }) => void
  reactions?: PostResponseDto['reaction_info']
}

const DEFAULT_REACTIONS = ['thumbsup', 'thumbsdown'] as const
type ReactionType = typeof DEFAULT_REACTIONS[number]

export function Emojies(props: EmojiesProps) {
  const { onClick, reactions: initialReactions } = props

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
    },
    [onClick],
  )

  return (
    <div className={cn('Emojies')}>
      {DEFAULT_REACTIONS.map((reaction) => (
        <button
          key={reaction}
          className={cn('EmojieBox', { active: reactions.myReaction === reaction })}
          onClick={() => handleReactionClick(reaction)}
        >
          <Icon name={reaction === 'thumbsup' ? 'thump-up' : 'thumb-down'} />
          <Text fs="12" letterSpacing={0.18}>{reactions.counts[reaction]}</Text>
        </button>
      ))}
    </div>
  )
}
