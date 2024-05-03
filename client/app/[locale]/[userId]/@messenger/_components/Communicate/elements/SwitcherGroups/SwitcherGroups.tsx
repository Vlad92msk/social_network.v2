import { ButtonCommon } from '@ui/common/ButtonCommon'
import { TextCommon } from '@ui/common/TextCommon'
import { classNames, makeCn } from '@utils/others'
import { useRootStore } from '../../../../_providers/root'
import style from './SwitcherGroups.module.scss'
import { SelectCommunicateType, useCommunicateListStore } from '../../../../_providers/communicateList'

export const cn = makeCn('SwitcherGroups', style)

interface SwitcherGroupsProps {
  className?: string
}

export function SwitcherGroups(props: SwitcherGroupsProps) {
  const { className } = props
  const selectType = useCommunicateListStore((state) => state.selectType)
  const set = useCommunicateListStore((state) => state.setSelectType)
  const status = useRootStore((state) => state.drawerStatus)

  return (
    <div className={classNames(cn(), className)}>
      <ButtonCommon className={cn('Button', { active: selectType === SelectCommunicateType.CONTACTS })} onClick={() => set(SelectCommunicateType.CONTACTS)}>
        <TextCommon fs={status === 'open' ? '12' : '8'}>Контакты</TextCommon>
      </ButtonCommon>
      <ButtonCommon className={cn('Button', { active: selectType === SelectCommunicateType.GROUPS })} onClick={() => set(SelectCommunicateType.GROUPS)}>
        <TextCommon fs={status === 'open' ? '12' : '8'}>Группы</TextCommon>
      </ButtonCommon>
    </div>
  )
}
