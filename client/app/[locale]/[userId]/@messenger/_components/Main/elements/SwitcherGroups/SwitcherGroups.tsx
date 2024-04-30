import { ButtonCommon } from '@ui/common/ButtonCommon'
import { TextCommon } from '@ui/common/TextCommon'
import { classNames, makeCn } from '@utils/others'
import { useCommunicateListStore } from '../../../../providers/communicateList.provider'
import { SelectCommunicateType } from '../../../../store/communicateList.store'
import style from './SwitcherGroups.module.scss'

export const cn = makeCn('SwitcherGroups', style)

interface SwitcherGroupsProps {
  className?: string
  status: 'open' | 'close'
}

export function SwitcherGroups(props: SwitcherGroupsProps) {
  const { className, status } = props
  const selectType = useCommunicateListStore((state) => state.selectType)
  const set = useCommunicateListStore((state) => state.setSelectType)

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
