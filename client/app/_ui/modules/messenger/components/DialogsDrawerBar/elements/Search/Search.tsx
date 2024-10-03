import { useState } from 'react'
import { useDebouncedSearch } from '@hooks'
import { Spinner } from '@ui/common/Spinner'
import { classNames, makeCn } from '@utils/others'
import { Icon } from 'app/_ui/common/Icon'
import { Input, InputGroup } from 'app/_ui/common/Input'
import style from './Search.module.scss'
import { userInfoApi } from '../../../../../../../../store/api'
import { useMessageStore } from '../../../../store'

export const cn = makeCn('Search', style)

interface SearchProps {
  className?: string
}

export function Search(props: SearchProps) {
  const { className } = props
  const set = useMessageStore((state) => state.setFilter)

  const [isFocus, setFocused] = useState(false)
  const [onGetUsers, { data, isLoading }] = userInfoApi.useLazyGetUsersQuery(undefined)

  const { handleChange } = useDebouncedSearch({
    debounceMs: 700,
    onSearch: (value) => {
      onGetUsers({ name: value })
    },
  })
  return (
    <div className={classNames(cn(), className)}>
      <InputGroup leftElement={<Icon name="search" />}>
        <Input
          className={cn('Input')}
          type="text"
          fs="14"
          placeholder="Поиск"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            set(e.currentTarget.value)
            handleChange(e.currentTarget.value)
          }}
        />
      </InputGroup>
      { isFocus && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '30px',
        }}
        >
          {
            isLoading ? <Spinner />
              : data?.map(({ name, id }) => (
                <div key={id}>{name}</div>
              ))
          }
        </div>
      )}
    </div>
  )
}
