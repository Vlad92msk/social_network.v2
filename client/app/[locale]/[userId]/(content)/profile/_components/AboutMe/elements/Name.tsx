import { useSelector } from 'synapse-storage/react'
import { Input } from '@ui/common/Input'
import { Text } from '@ui/common/Text'
import { userInfoSynapse } from '../../../../../../../store/synapses/user-info/user-info.synapse'
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
