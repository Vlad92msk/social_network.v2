import { ButtonCommon } from '@ui/common/ButtonCommon'
import { classNames } from '@utils/others'
import { cn } from './cn'
import { useRootStore } from '../../../../_providers/root'

interface ButtonCloseChatProps {
  className?: string
}

export function ButtonCloseChat(props: ButtonCloseChatProps) {
  const { className } = props

  const handleCloseChat = useRootStore((state) => state.setChatingPanelStatus)

  return (
    <ButtonCommon
      className={classNames(cn('ButtonCloseChat'), className)}
      onClick={() => handleCloseChat('close')}
    >
      X
    </ButtonCommon>
  )
}
