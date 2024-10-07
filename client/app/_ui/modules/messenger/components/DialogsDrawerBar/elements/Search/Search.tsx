import { useEffect, useRef, useState } from 'react'
import { useDebouncedSearch } from '@hooks'
import { Button } from '@ui/common/Button'
import { Spinner } from '@ui/common/Spinner'
import { Text } from '@ui/common/Text'
import { Listitem } from '@ui/modules/messenger/components/DialogsDrawerBar/elements/Listitem'
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
  const setSelectUSer = useMessageStore((state) => state.setSelectUSer)
  const setChatingPanelStatus = useMessageStore((state) => state.setChatingPanelStatus)

  const [isFocus, setFocused] = useState(false)

  const [onGetUsers, { data, isLoading }] = userInfoApi.useLazyGetUsersQuery()

  const componentRef = useRef<HTMLDivElement>(null)

  const { handleChange } = useDebouncedSearch({
    debounceMs: 700,
    onSearch: (value) => {
      if (value?.length) {
        onGetUsers({ name: value })
      }
    },
  })

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (componentRef.current && !componentRef.current.contains(event.target as Node)) {
        setFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className={classNames(cn(), className)} ref={componentRef}>
      <InputGroup leftElement={<Icon name="search" />}>
        <Input
          className={cn('Input')}
          type="text"
          fs="14"
          placeholder="Поиск"
          onFocus={() => setFocused(true)}
          onChange={(e) => {
            set(e.currentTarget.value)
            handleChange(e.currentTarget.value)
          }}
        />
      </InputGroup>
      {isFocus && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '30px',
          }}
        >
          <Text fs="12">Поиск пользователей</Text>
          {isLoading ? (
            <Spinner />
          ) : (
            data?.map((user) => {
              const { name, id, profile_image, public_id } = user
              return (
                <Listitem
                  key={id}
                  contactName={name}
                  img={profile_image}
                  actions={(
                    <>
                      <Button
                        onClick={(event) => {
                          event.stopPropagation()
                          console.log(`Открыл диалог с ID: ${public_id}`)
                          setSelectUSer(user)
                          setChatingPanelStatus('open')
                        }}
                      >
                        <Text fs="12">Чат</Text>
                      </Button>
                      <Button
                        onClick={(event) => {
                          event.stopPropagation()
                          console.log(`К контакту: ${public_id}`)
                        }}
                      >
                        <Text fs="12">К контакту</Text>
                      </Button>
                    </>
                  )}
                />
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
