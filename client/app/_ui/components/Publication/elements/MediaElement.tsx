import { ReactElement } from 'react'
import { Button } from '@ui/common/Button'
import { Icon } from '@ui/common/Icon'
import { cn } from '../cn'
import { usePublicationCtxSelect } from '../Publication'

interface MediaElementProps<T> {
  data: T
  element: (data: T) => ReactElement
  onRemove: (data: T) => void
}

export function MediaElement<T>(props: MediaElementProps<T>) {
  const { data, element, onRemove } = props
  const isChangeActive = usePublicationCtxSelect((store) => (store.isChangeActive))

  return (
    <div className={cn('MediaContainerImgBox')}>
      <Button
        className={cn('MediaContainerImgButtonRemove', { active: isChangeActive })}
        onClick={(event) => {
          onRemove(data)
        }}
      >
        <Icon name="delete" />
      </Button>
      {element(data)}
    </div>
  )
}
