import { useDispatch, useSelector } from 'react-redux'
import { classNames, makeCn } from '@utils/others'
import { Button } from 'app/_ui/common/Button'
import { Text } from 'app/_ui/common/Text'
import style from './SwitcherDialogType.module.scss'
import { MessengerSliceActions, SelectDialogType } from '../../../../store/messenger.slice'
import { MessengerSelectors } from '../../../../store/selectors'

export const cn = makeCn('SwitcherDialogType', style)

interface SwitcherDialogTypeProps {
  className?: string
}

export function SwitcherDialogType(props: SwitcherDialogTypeProps) {
  const { className } = props
  const dispatch = useDispatch()
  const status = useSelector(MessengerSelectors.selectDrawerStatus)
  const selectType = useSelector(MessengerSelectors.selectSelectType)

  return (
    <div className={classNames(cn(), className)}>
      <Button
        className={cn('Button', { active: selectType === SelectDialogType.PRIVATE })}
        onClick={() => dispatch(MessengerSliceActions.setSelectType(SelectDialogType.PRIVATE))}
      >
        <Text fs={status === 'open' ? '12' : '8'}>Личные</Text>
      </Button>
      <Button
        className={cn('Button', { active: selectType === SelectDialogType.PUBLIC })}
        onClick={() => dispatch(MessengerSliceActions.setSelectType(SelectDialogType.PUBLIC))}
      >
        <Text fs={status === 'open' ? '12' : '8'}>Групповые</Text>
      </Button>
    </div>
  )
}
