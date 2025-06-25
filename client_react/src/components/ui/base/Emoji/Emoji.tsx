import { lazy } from 'react'

export const Emoji = lazy(() => import('emoji-picker-react'))

export enum EmojiStyle {
  NATIVE = 'native',
  APPLE = 'apple',
  TWITTER = 'twitter',
  GOOGLE = 'google',
  FACEBOOK = 'facebook'
}

export enum Theme {
  DARK = 'dark',
  LIGHT = 'light',
  AUTO = 'auto'
}


// import { Suspense } from 'react'
// import { Emoji, EmojiStyle, Theme } from './Emoji'
//
// function MyComponent() {
//   return (
//     <Suspense fallback={<div>Загрузка...</div>}>
//       <Emoji
//         theme={Theme.DARK}
//         emojiStyle={EmojiStyle.NATIVE}
//         onEmojiClick={(emojiData) => console.log(emojiData)}
//       />
//     </Suspense>
//   )
// }
