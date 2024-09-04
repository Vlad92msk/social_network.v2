import { LOCALES } from '@middlewares/variables'
import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({locale}) => {
  if (!LOCALES.includes(locale as any)) notFound();
  return {
    messages: (await import(`./translations/${locale}.json`)).default
    // messenger: translations[locale]
  };
});
