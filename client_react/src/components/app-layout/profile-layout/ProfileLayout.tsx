import { makeCn } from '@utils'

import style from './ProfileLayout.module.scss'

const cn = makeCn('ProfileLayout', style)

export interface LayoutProps {
  areas: {
    mainMenu: React.ReactNode
    secondMenu: React.ReactNode
    content: React.ReactNode
  }
  layoutVariant: string
}

export function ProfileLayout(props: LayoutProps) {
  const { areas, layoutVariant } = props
  const { secondMenu, mainMenu, content } = areas

  return (
    <div className={cn({ variant: layoutVariant })}>
      <div className={cn('MainMenu')}>{mainMenu}</div>
      <div className={cn('SecondMenu')}>{secondMenu}</div>
      <div className={cn('ContentArea')}>{content}</div>
    </div>
  )
}
