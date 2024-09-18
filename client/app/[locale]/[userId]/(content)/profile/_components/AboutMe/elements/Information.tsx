import { TextArea } from '@ui/common/Input'
import { Text } from '@ui/common/Text'
import { setImmutable } from '@utils/others'
import { cn } from '../cn'
import { useUpdateContextField } from '../hooks'

interface InformationProps {
  information?: string
}

export function Information(props: InformationProps) {
  const { information } = props
  const [getValue, setValue, isChangeActive, updateCtx] = useUpdateContextField(information, 'information')

  return (
    <div className={cn('Information')}>
      {isChangeActive ? (
        <TextArea
          value={getValue}
          onChange={(event) => {
            const newText = event.target.value
            updateCtx((ctx) => setImmutable(ctx, 'changeState.information', newText))
            setValue(newText)
          }}
        />
      ) : (
        <Text fs="16" lineHeight={30}>{getValue}</Text>
      )}
    </div>
  )
}
