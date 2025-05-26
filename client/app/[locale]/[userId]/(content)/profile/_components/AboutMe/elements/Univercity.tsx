import { Icon } from '@ui/common/Icon'
import { Input } from '@ui/common/Input'
import { Text } from '@ui/common/Text'
import { useSelector } from 'synapse-storage/react'
import { userInfoSynapse } from '../../../../../../../store/synapses/user-info/user-info.synapse'
import { cn } from '../cn'

const { selectors, actions } = userInfoSynapse

interface UniversityProps {
  // university?: string
}

export function Univercity(props: UniversityProps) {
  const fieldUniversity = useSelector(selectors.fieldUniversity)
  const isChangeActive = useSelector(selectors.isChangeActive)

  return (
    <div className={cn('Univercity')}>
      {isChangeActive ? (
        <Input
          value={fieldUniversity}
          onChange={(event) => {
            const newText = event.target.value
            actions.updateField({
              university: newText,
            })
          }}
        />
      ) : (
        <Text weight="bold">{fieldUniversity}</Text>
      )}
      <Icon name="studying-university" />
    </div>
  )
}
