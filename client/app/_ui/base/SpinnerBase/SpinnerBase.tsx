import { Spinner as SpinnerChakra, SpinnerProps as SpinnerChakraProps } from '@chakra-ui/react'
import { classNames, makeCn } from '@utils/others'

import style from './Spinner.module.scss'

type SpinnerBaseProps = SpinnerChakraProps

const cn = makeCn('Page', style)

export function SpinnerBase(props: SpinnerBaseProps) {
  const { className } = props

  return <SpinnerChakra className={classNames(cn(), className)} />
}
