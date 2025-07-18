import { Icon, Input, Text } from '@components/ui'
import { userAboutSynapse } from '@store/synapses/user-about'
import { useSelector } from 'synapse-storage/react'

import { cn } from '../cn'

const { selectors, actions } = userAboutSynapse

interface CompanyProps {
  // company?: string
}

export function Company(props: CompanyProps) {
  const fieldCompany = useSelector(selectors.fieldCompany)
  const isChangeActive = useSelector(selectors.isChangeActive)

  return (
    <div className={cn('Company')}>
      {isChangeActive ? (
        <Input
          value={fieldCompany}
          onChange={(event) => {
            const newText = event.target.value
            actions.updateField({
              company: newText,
            })
          }}
        />
      ) : (
        <Text weight="bold">{fieldCompany}</Text>
      )}
      <Icon name="job-in-company" />
    </div>
  )
}
