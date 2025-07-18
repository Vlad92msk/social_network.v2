import { Input, Text } from '@components/ui'
import { userAboutSynapse } from '@store/synapses/user-about'
import { useSelector } from 'synapse-storage/react'

import { cn } from '../cn'

const { selectors, actions } = userAboutSynapse

interface PositionProps {
  // position?: string
}

export function Position(props: PositionProps) {
  const fieldPosition = useSelector(selectors.fieldPosition)
  const isChangeActive = useSelector(selectors.isChangeActive)

  return (
    <div className={cn('Position')}>
      {isChangeActive ? (
        <Input
          value={fieldPosition}
          onChange={(event) => {
            const newText = event.target.value
            actions.updateField({
              position: newText,
            })
          }}
        />
      ) : (
        <Text weight="bold">{fieldPosition}</Text>
      )}
    </div>
  )
}
