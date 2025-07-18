import { Text, TextArea } from '@components/ui'
import { userAboutSynapse } from '@store/synapses/user-about'
import { useSelector } from 'synapse-storage/react'

import { cn } from '../cn'

const { selectors, actions } = userAboutSynapse

interface InformationProps {}

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
        <Text fs="16" lineHeight={30}>
          {fieldInformation}
        </Text>
      )}
    </div>
  )
}
