import { makeCn } from '@utils/others'
import style from './ContentArea.module.scss'

const cn = makeCn('ContentArea', style)


export interface ContentAreaProps {}

export const ContentArea = (props: ContentAreaProps) => {


  return (<div className={cn()}>ContentArea</div>)
}
