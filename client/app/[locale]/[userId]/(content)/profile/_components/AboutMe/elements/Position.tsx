import { Input } from '@ui/common/Input'
import { Text } from '@ui/common/Text'
import { setImmutable } from '@utils/others'
import { cn } from '../cn'
import { useUpdateContextField } from '../hooks'

interface PositionProps {
  position?: string
}

export function Position(props: PositionProps) {
  const { position } = props

  const [getValue, setValue, isChangeActive, updateCtx] = useUpdateContextField(position, 'position')

  return (
    <div className={cn('Position')}>
      {isChangeActive ? (
        <Input
          value={getValue}
          onChange={(event) => {
            const newText = event.target.value
            updateCtx((ctx) => setImmutable(ctx, 'changeState.position', newText))
            setValue(newText)
          }}
        />
      ) : (
        <Text weight="bold">{getValue}</Text>
      )}
    </div>
  )
}
