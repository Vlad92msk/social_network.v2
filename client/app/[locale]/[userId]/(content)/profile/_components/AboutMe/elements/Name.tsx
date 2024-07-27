import { Input } from '@ui/common/Input'
import { Text } from '@ui/common/Text'
import { setImmutable } from '@utils/others'
import { cn } from '../cn'
import { useUpdateContextField } from '../hooks'

interface NameProps {
  name?: string
}

export function Name(props: NameProps) {
  const { name } = props

  const [getValue, setValue, isChangeActive, updateCtx] = useUpdateContextField(name, 'name')

  return (
    <div className={cn('Name')}>
      {isChangeActive ? (
        <Input
          value={getValue}
          onChange={(event) => {
            const newText = event.target.value
            updateCtx((ctx) => setImmutable(ctx, 'changeState.name', newText))
            setValue(newText)
          }}
        />
      ) : (
        <Text weight="bold">{getValue}</Text>
      )}
    </div>
  )
}
