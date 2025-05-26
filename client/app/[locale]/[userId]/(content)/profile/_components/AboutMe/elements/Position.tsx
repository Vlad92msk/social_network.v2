import { useSelector } from 'synapse-storage/react'
import { Input } from '@ui/common/Input'
import { Text } from '@ui/common/Text'
import { userInfoSynapse } from '../../../../../../../store/synapses/user-info/user-info.synapse'
import { cn } from '../cn'

const { selectors, actions } = userInfoSynapse

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
