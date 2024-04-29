import { IconBase } from '@ui/base/IconBase'
import { InputCommon, InputGroupCommon } from '@ui/common/InputCommon'
import { classNames, makeCn } from '@utils/others'
import style from './Search.module.scss'

export const cn = makeCn('Search', style)

interface SearchProps {
  className?: string
}

export function Search(props: SearchProps) {
  const { className } = props

  return (
    <div className={classNames(cn(), className)}>
      <InputGroupCommon leftElement={<IconBase name="git" />}>
        <InputCommon
          className={cn('Input')}
          type="text"
          fs="14"
          placeholder="Поиск"
          onChange={(e) => {
            console.log('change', e.currentTarget.value)
          }}
        />
      </InputGroupCommon>
    </div>
  )
}
