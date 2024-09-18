import { Icon } from '@ui/common/Icon'
import { Input } from '@ui/common/Input'
import { Text } from '@ui/common/Text'
import { setImmutable } from '@utils/others'
import { cn } from '../cn'
import { useUpdateContextField } from '../hooks'

interface UnivercityProps {
  university?: string
}

export function Univercity(props: UnivercityProps) {
  const { university } = props

  const [getValue, setValue, isChangeActive, updateCtx] = useUpdateContextField(university, 'university')
console.log('getValue', getValue)
  return (
    <div className={cn('Univercity')}>
      {isChangeActive ? (
        <Input
          value={getValue}
          onChange={(event) => {
            const newText = event.target.value
            updateCtx((ctx) => setImmutable(ctx, 'changeState.university', newText))
            setValue(newText)
          }}
        />
      ) : (
        <Text weight="bold">{getValue}</Text>
      )}
      <Icon name="studying-university" />
    </div>
  )
}
