import { makeCn } from '@utils/others'
import { getServerProfile } from '@utils/server'
import { Conference } from './_components'
import style from './page.module.scss'

const cn = makeCn('ConferencePage', style)

export default async function ConferencePage() {
  const profile = await getServerProfile()

  return (
    <Conference profile={profile} />
  )
}
