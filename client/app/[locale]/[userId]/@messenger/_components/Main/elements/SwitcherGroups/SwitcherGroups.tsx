import { ButtonCommon } from '@ui/common/ButtonCommon'
import { TextCommon } from '@ui/common/TextCommon'
import { classNames, makeCn } from '@utils/others'
import style from './SwitcherGroups.module.scss'

export const cn = makeCn('SwitcherGroups', style)

interface SwitcherGroupsProps {
  className?: string
  status: 'open' | 'close'
}

export function SwitcherGroups(props: SwitcherGroupsProps) {
  const { className, status } = props

  return (
    <div className={classNames(cn(), className)}>
      <ButtonCommon className={cn('Button')}>
        <TextCommon fs={status === 'open' ? '12' : '8'}>Контакты</TextCommon>
      </ButtonCommon>
      <ButtonCommon className={cn('Button')}>
        <TextCommon fs={status === 'open' ? '12' : '8'}>Группы</TextCommon>
      </ButtonCommon>
    </div>
  )
}
