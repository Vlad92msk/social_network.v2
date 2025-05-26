import { useSelector } from 'synapse-storage/react'
import { TextArea } from '@ui/common/Input'
import { Text } from '@ui/common/Text'
import { userInfoSynapse } from '../../../../../../../store/synapses/user-info/user-info.synapse'
import { cn } from '../cn'

const { selectors, actions } = userInfoSynapse

interface InformationProps {
}

export function Information(props: InformationProps) {
  const fieldInformation = useSelector(selectors.fieldInformation)
  const isChangeActive = useSelector(selectors.isChangeActive)

  return (
    <div className={cn('Information')}>
      {isChangeActive ? (
        <TextArea
          value={fieldInformation}
          onChange={(event) => {
            const newText = event.target.value
            actions.updateField({
              information: newText,
            })
          }}
        />
      ) : (
        <Text fs="16" lineHeight={30}>{fieldInformation}</Text>
      )}
    </div>
  )
}
