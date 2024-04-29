import { ButtonCommon } from '@ui/common/ButtonCommon'
import { TextCommon } from '@ui/common/TextCommon'
import { classNames, makeCn } from '@utils/others'
import { SelectType, useMessengerContacts } from '../../../../store/contacts'
import style from './SwitcherGroups.module.scss'

export const cn = makeCn('SwitcherGroups', style)

interface SwitcherGroupsProps {
  className?: string
  status: 'open' | 'close'
}

export function SwitcherGroups(props: SwitcherGroupsProps) {
  const { className, status } = props
  const selectType = useMessengerContacts((state) => state.selectType)
  const set = useMessengerContacts((state) => state.setSelectType)

  return (
    <div className={classNames(cn(), className)}>
      <ButtonCommon className={cn('Button', { active: selectType === SelectType.CONTACTS })} onClick={() => set(SelectType.CONTACTS)}>
        <TextCommon fs={status === 'open' ? '12' : '8'}>Контакты</TextCommon>
      </ButtonCommon>
      <ButtonCommon className={cn('Button', { active: selectType === SelectType.GROUPS })} onClick={() => set(SelectType.GROUPS)}>
        <TextCommon fs={status === 'open' ? '12' : '8'}>Группы</TextCommon>
      </ButtonCommon>
    </div>
  )
}
