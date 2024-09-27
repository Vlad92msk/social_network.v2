import { mapValues, merge, pick } from 'lodash'
import { useCallback, useEffect, useState } from 'react'
import { Icon } from 'app/_ui/common/Icon'
import { Text } from 'app/_ui/common/Text'
import { CalculateReactionsResponse } from '../../../../../../swagger/reactions/interfaces-reactions'
import { cn } from '../cn'

interface ReactionsState extends CalculateReactionsResponse {
  [key: string]: string | number;
}

interface EmojiesProps {
  onClick?: (emoji: { name: string }) => void;
  reactions?: Partial<ReactionsState>;
}

const DEFAULT_REACTIONS = ['thumbsup', 'thumbsdown']

export function Emojies({ onClick, reactions: initialReactions }: EmojiesProps) {
  const [reactions, setReactions] = useState<ReactionsState>(() => {
    const initialState = DEFAULT_REACTIONS.reduce(
      (acc, reaction) => ({ ...acc, [reaction]: 0 }),
      { my_reaction: null },
    )
    return merge({}, initialState, initialReactions)
  })

  useEffect(() => {
    if (initialReactions) {
      setReactions((prev) => merge({}, prev, initialReactions))
    }
  }, [initialReactions])

  const handleReactionClick = useCallback(
    (name: string) => {
      setReactions((prev) => {
        const isRemoving = prev.my_reaction === name

        const updatedReactions = mapValues(prev, (count, key) => {
          if (key === 'my_reaction') return isRemoving ? null : name
          if (key === name) return isRemoving ? Math.max(0, (count as number) - 1) : (count as number) + 1
          if (key === prev.my_reaction) return Math.max(0, (count as number) - 1)
          return count
        })

        return updatedReactions as ReactionsState
      })

      if (onClick) onClick({ name })
    },
    [onClick],
  )

  const availableReactions = pick(reactions, DEFAULT_REACTIONS)

  return (
    <div className={cn('Emojies')}>
      {Object.keys(availableReactions).map((reaction) => (
        <button
          key={reaction}
          className={cn('EmojieBox', { active: reactions.my_reaction === reaction })}
          onClick={() => handleReactionClick(reaction)}
        >
          <Icon name={reaction === 'thumbsup' ? 'thump-up' : 'thumb-down'} />
          <Text fs="12" letterSpacing={0.18}>{reactions[reaction]}</Text>
        </button>
      ))}
    </div>
  )
}
