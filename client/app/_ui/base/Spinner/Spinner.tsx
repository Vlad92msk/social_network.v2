import { Spinner as SpinnerChakra, SpinnerProps as SpinnerChakraProps } from '@chakra-ui/react'
import { classNames, makeCn } from '@shared/utils/makeCn'

import style from './Spinner.module.scss'

type SpinnerProps = SpinnerChakraProps

const cn = makeCn('Page', style)

export function Spinner(props: SpinnerProps) {
  const { className } = props

  return <SpinnerChakra className={classNames(cn(), className)} />
}
