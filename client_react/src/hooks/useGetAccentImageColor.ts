// import { Property } from 'csstype'
// import { FastAverageColor } from 'fast-average-color'
// import { useEffect, useState } from 'react'
// import { invertColor } from '@public/utils'
//
// const fac = new FastAverageColor()
//
// type UseGetAccentImageColorResponse = [
//   Property.Background | undefined,
//   Property.Color | undefined,
//   Property.Color | undefined,
// ]
//
// export const useGetAccentImageColor = (src: string, opacity?: number): UseGetAccentImageColorResponse => {
//   const [color, setBcg] = useState<Property.Background>()
//   const [hexColor, setHex] = useState<Property.Color>()
//
//   useEffect(() => {
//     fac.getColorAsync(src)
//       .then(({ value, hex }) => {
//         setBcg(`rgba(${value[0]}, ${value[1]}, ${value[2]}${opacity && `,${opacity}`})`)
//         setHex(hex)
//       })
//       .catch((e) => {
//         console.log(e)
//       })
//   }, [opacity, src])
//
//   return [color, hexColor, invertColor(hexColor)]
// }
