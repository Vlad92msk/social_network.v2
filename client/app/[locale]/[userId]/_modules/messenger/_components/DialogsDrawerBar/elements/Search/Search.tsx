import { IconBase } from '@ui/base/IconBase'
import { InputCommon, InputGroupCommon } from '@ui/common/InputCommon'
import { classNames, makeCn } from '@utils/others'
import style from './Search.module.scss'
import { useDialogListStore } from '../../../../_providers/dialogList'

export const cn = makeCn('Search', style)

interface SearchProps {
  className?: string
}

export function Search(props: SearchProps) {
  const { className } = props
  const set = useDialogListStore((state) => state.setFilter)
  return (
    <div className={classNames(cn(), className)}>
      <InputGroupCommon leftElement={<IconBase name="search" />}>
        <InputCommon
          className={cn('Input')}
          type="text"
          fs="14"
          placeholder="Поиск"
          onChange={(e) => {
            set(e.currentTarget.value)
          }}
        />
      </InputGroupCommon>
    </div>
  )
}
