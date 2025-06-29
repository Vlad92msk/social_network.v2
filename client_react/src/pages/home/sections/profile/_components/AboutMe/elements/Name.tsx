import { Input, Text } from '@components/ui'
import { userInfoSynapse } from '@store/synapses/user-info'
import { useSelector } from 'synapse-storage/react'

import { cn } from '../cn'

const { selectors, actions } = userInfoSynapse

interface NameProps {
  // name?: string
}

export function Name(props: NameProps) {
  const fieldsName = useSelector(selectors.fieldName)
  const isChangeActive = useSelector(selectors.isChangeActive)

  return (
    <div className={cn('Name')}>
      {isChangeActive ? (
        <Input
          value={fieldsName}
          onChange={(event) => {
            const newText = event.target.value
            actions.updateField({
              name: newText,
            })
          }}
        />
      ) : (
        <Text weight="bold">{fieldsName}</Text>
      )}
    </div>
  )
}
