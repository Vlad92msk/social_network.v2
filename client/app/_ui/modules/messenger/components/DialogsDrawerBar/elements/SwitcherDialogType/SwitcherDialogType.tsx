import { useSelector } from 'react-redux'
import { SelectDialogType } from '@api/messenger/dialogs/types/dialogs.type'
import { MessengerSelectors } from '@ui/modules/messenger/store/selectors'
import { classNames, makeCn } from '@utils/others'
import { Button } from 'app/_ui/common/Button'
import { Text } from 'app/_ui/common/Text'
import style from './SwitcherDialogType.module.scss'
import { useMessageStore } from '../../../../store'

export const cn = makeCn('SwitcherDialogType', style)

interface SwitcherDialogTypeProps {
  className?: string
}

export function SwitcherDialogType(props: SwitcherDialogTypeProps) {
  const { className } = props
  const status = useSelector(MessengerSelectors.selectDrawerStatus)
  const selectType = useMessageStore((state) => state.selectType)
  const set = useMessageStore((state) => state.setSelectType)

  return (
    <div className={classNames(cn(), className)}>
      <Button
        className={cn('Button', { active: selectType === SelectDialogType.PRIVATE })}
        onClick={() => set(SelectDialogType.PRIVATE)}
      >
        <Text fs={status === 'open' ? '12' : '8'}>Личные</Text>
      </Button>
      <Button
        className={cn('Button', { active: selectType === SelectDialogType.PUBLIC })}
        onClick={() => set(SelectDialogType.PUBLIC)}
      >
        <Text fs={status === 'open' ? '12' : '8'}>Групповые</Text>
      </Button>
    </div>
  )
}
