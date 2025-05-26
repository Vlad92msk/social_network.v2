import { useSelector } from 'synapse-storage/react'
import { Icon } from '@ui/common/Icon'
import { Input } from '@ui/common/Input'
import { Text } from '@ui/common/Text'
import { userInfoSynapse } from '../../../../../../../store/synapses/user-info/user-info.synapse'
import { cn } from '../cn'

const { selectors, actions } = userInfoSynapse

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
