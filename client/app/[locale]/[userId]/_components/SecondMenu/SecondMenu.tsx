import { makeCn } from '@utils/others'
import style from './SecondMenu.module.scss'

const cn = makeCn('SecondMenu', style)


export interface SecondMenuProps {}

export const SecondMenu = (props: SecondMenuProps) => {


  return (<div className={cn()}>SecondMenu</div>)
}


