import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useDebouncedSearch } from '@hooks'
import { Button } from '@ui/common/Button'
import { Icon } from '@ui/common/Icon'
import { Input, InputGroup } from '@ui/common/Input'
import { Spinner } from '@ui/common/Spinner'
import { Text } from '@ui/common/Text'
import { Listitem } from '@ui/modules/messenger/components/DialogsDrawerBar/elements/Listitem'
import { MessengerSelectors } from '@ui/modules/messenger/store/selectors'
import { cn } from './cn'
import { dialogsApi, userInfoApi } from '../../../../../../../../store/api'

export function SearchUsers() {
  const [isFocus, setFocused] = useState(false)
  const dialogId = useSelector(MessengerSelectors.selectCurrentDialogId)
  const dialog = useSelector(MessengerSelectors.selectCurrentDialog)
  const [onUpdate] = dialogsApi.useUpdateMutation()

  /**
   * Ищем пользователей в БД по имени
   */
  const [onFindUsersByName, { data, isLoading }] = userInfoApi.useLazyGetUsersQuery({
    selectFromResult: (state) => ({
      data: state.data?.filter(({ id }) => !dialog?.participants?.some((p) => p.id === id)),
      isLoading: state.isLoading,
    }),
  })

  const componentRef = useRef<HTMLDivElement>(null)

  const { handleChange } = useDebouncedSearch({
    debounceMs: 700,
    onSearch: (value) => {
      if (value?.length) {
        onFindUsersByName({ name: value })
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
    <div className={cn('SearchUsers')} ref={componentRef}>
      <InputGroup leftElement={<Icon name="search" />}>
        <Input
          className={cn('SearchUsersInput')}
          type="text"
          fs="14"
          placeholder="Добавить участника"
          onFocus={() => setFocused(true)}
          onChange={(e) => {
            handleChange(e.currentTarget.value)
          }}
        />
      </InputGroup>
      {isFocus && (
        <div className={cn('SearchUsersList')}>
          {isLoading ? (
            <Spinner />
          ) : (
            data?.map((user) => {
              const {
                name,
                id,
                profile_image,
                public_id,
              } = user
              return (
                <Listitem
                  key={id}
                  contactName={name}
                  img={profile_image}
                  actions={(
                    <Button
                      onClick={(event) => {
                        event.stopPropagation()
                        onUpdate({ id: dialogId, body: { add_participants: [id] } })
                      }}
                    >
                      <Text fs="12">Добавить</Text>
                    </Button>
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
