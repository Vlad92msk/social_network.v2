'use client'

import { signOut, useSession } from 'next-auth/react'
import { useThemeServiceUpdate } from '@services/theme'
import { makeCn } from '@shared/utils/makeCn'
import { Button } from '@ui/base/Button/Button'
import { Icon } from '@ui/base/Icon'

import style from './Section.module.scss'

const cn = makeCn('Section', style)

export function Section() {
  const session = useSession()
  const themeUpdate = useThemeServiceUpdate()
  // console.log('session', session)

  return (
    <div className={cn('Dd')}>

      <div>section 1</div>
      <Button isLoading>111</Button>
      <button onClick={() => signOut()}>
        Выйти
      </button>
      <Icon name="git" fill="red" />
    </div>
  )
}
