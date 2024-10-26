import { makeCn } from '@utils/others'
import { Conference } from './_components'
import style from './page.module.scss'

const cn = makeCn('ConferencePage', style)

export default async function ConferencePage() {
  return (
    <Conference />
  )
}
