'use server'

import { addMonths } from 'date-fns'
import { cookies } from 'next/headers'
import { Locales } from '../../middlwares/location'

export const setLocale = (newLocale: Locales) => {
  cookies().set({
    name: 'NEXT_LOCALE',
    value: newLocale,
    expires: addMonths(new Date(), 1),
    path: '/',
  })
}
