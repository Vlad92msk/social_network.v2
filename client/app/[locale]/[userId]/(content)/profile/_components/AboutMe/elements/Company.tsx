import { Icon } from '@ui/common/Icon'
import { Input } from '@ui/common/Input'
import { Text } from '@ui/common/Text'
import { setImmutable } from '@utils/others'
import { cn } from '../cn'
import { useUpdateContextField } from '../hooks'

interface CompanyProps {
  company?: string
}

export function Company(props: CompanyProps) {
  const { company } = props

  const [getValue, setValue, isChangeActive, updateCtx] = useUpdateContextField(company, 'company')

  return (
    <div className={cn('Company')}>
      {isChangeActive ? (
        <Input
          value={getValue}
          onChange={(event) => {
            const newText = event.target.value
            updateCtx((ctx) => setImmutable(ctx, 'changeState.company', newText))
            setValue(newText)
          }}
        />
      ) : (
        <Text weight="bold">{getValue}</Text>
      )}
      <Icon name="job-in-company" />
    </div>
  )
}
