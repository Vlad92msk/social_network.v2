import { TextArea } from '@ui/common/Input'
import { classNames } from '@utils/others'
import { Text as TextComponent } from 'app/_ui/common/Text'
import { cn } from '../cn'
import { usePublicationCtxSelect, usePublicationCtxUpdate } from '../Publication'

interface TextProps {
  className?: string
}
export function Text(props: TextProps) {
  const { className } = props
  const handleUpdateText = usePublicationCtxUpdate()
  const isChangeActive = usePublicationCtxSelect((store) => store.isChangeActive)
  const textInitialChange = usePublicationCtxSelect((store) => store.changeState?.text)
  const textInitial = usePublicationCtxSelect((store) => store.text)

  return (
    <div className={classNames(cn('Text'), className)}>
      {
        isChangeActive ? (
          <TextArea
            fs="14"
            value={textInitialChange}
            onChange={(event) => handleUpdateText((ctx) => ({
              changeState: {
                ...ctx.changeState,
                text: event.target.value,
              },
            }))}
            className={(cn('TextContent'))}
          />
        ) : (
          <TextComponent
            fs="14"
            className={(cn('TextContent'))}
          >
            {textInitial}
          </TextComponent>
        )
      }
    </div>
  )
}
