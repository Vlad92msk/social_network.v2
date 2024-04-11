import { makeCn } from '@utils/others'
import style from './Layout.module.scss'

const cn = makeCn('Layout', style)

export interface LayoutProps {
  areas:{
    mainMenu: JSX.Element
    secondMenu: JSX.Element
    contentArea: JSX.Element
  }
}

export function Layout(props: LayoutProps) {
  const { areas } = props
  const { secondMenu, mainMenu, contentArea } = areas

  return (
    <div className={cn()}>
      <div className={cn('MainMenu')}>{mainMenu}</div>
      <div className={cn('SecondMenu')}>{secondMenu}</div>
      <div className={cn('ContentArea')}>{contentArea}</div>
    </div>
  )
}
