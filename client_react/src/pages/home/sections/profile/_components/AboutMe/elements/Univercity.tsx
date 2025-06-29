import { Icon, Input, Text } from '@components/ui'
import { userInfoSynapse } from '@store/synapses/user-info'
import { useSelector } from 'synapse-storage/react'

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
