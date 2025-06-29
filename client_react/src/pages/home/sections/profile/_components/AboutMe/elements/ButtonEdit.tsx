import { useEffect, useState } from 'react'
import { Button, Icon } from '@components/ui'
import { userInfoSynapse } from '@store/synapses/user-info'
import { isEqual } from 'lodash'
import { distinctUntilChanged, map } from 'rxjs/operators'
import { useSelector } from 'synapse-storage/react'

import { cn } from '../cn'

const { selectors, actions, state$ } = userInfoSynapse
interface ButtonEditProps {}

export function ButtonEdit(props: ButtonEditProps) {
  const [disabled, setDisabled] = useState(true)

  const isChangeActive = useSelector(selectors.isChangeActive)

  useEffect(() => {
    state$
      .pipe(
        map(({ fieldsInit, fields }) => isEqual(fields, fieldsInit)),
        distinctUntilChanged(),
      )
      .subscribe(setDisabled)
  }, [])

  return (
    <div className={cn('ButtonEdit')}>
      {isChangeActive && (
        <Button>
          <Icon
            name="close"
            onClick={async () => {
              await actions.reset()
            }}
          />
        </Button>
      )}
      {isChangeActive && (
        <Button
          disabled={disabled}
          onClick={async () => {
            await actions.submit()
          }}
        >
          <Icon name="approve" />
        </Button>
      )}

      <Button
        onClick={async () => {
          await actions.setActiveChange()
        }}
      >
        <Icon name="edit" />
      </Button>
    </div>
  )
}
