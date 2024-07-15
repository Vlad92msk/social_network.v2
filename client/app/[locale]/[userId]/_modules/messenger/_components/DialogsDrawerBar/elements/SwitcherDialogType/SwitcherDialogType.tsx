import { SelectDialogType } from '@api/messenger/dialogs/types/dialogs.type'
import { Button } from 'app/_ui/common/Button'
import { Text } from 'app/_ui/common/Text'
import { classNames, makeCn } from '@utils/others'
import style from './SwitcherDialogType.module.scss'
import { useDialogListStore } from '../../../../_providers/dialogList'
import { useRootStore } from '../../../../_providers/root'

export const cn = makeCn('SwitcherDialogType', style)

interface SwitcherDialogTypeProps {
  className?: string
}

export function SwitcherDialogType(props: SwitcherDialogTypeProps) {
  const { className } = props
  const selectType = useDialogListStore((state) => state.selectType)
  const set = useDialogListStore((state) => state.setSelectType)
  const status = useRootStore((state) => state.drawerStatus)

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
