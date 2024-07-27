import { classNames, makeCn } from '@utils/others'
import { Icon } from 'app/_ui/common/Icon'
import { Input, InputGroup } from 'app/_ui/common/Input'
import style from './Search.module.scss'
import { useMessageStore } from '../../../../store'

export const cn = makeCn('Search', style)

interface SearchProps {
  className?: string
}

export function Search(props: SearchProps) {
  const { className } = props
  const set = useMessageStore((state) => state.setFilter)
  return (
    <div className={classNames(cn(), className)}>
      <InputGroup leftElement={<Icon name="search" />}>
        <Input
          className={cn('Input')}
          type="text"
          fs="14"
          placeholder="Поиск"
          onChange={(e) => {
            set(e.currentTarget.value)
          }}
        />
      </InputGroup>
    </div>
  )
}
