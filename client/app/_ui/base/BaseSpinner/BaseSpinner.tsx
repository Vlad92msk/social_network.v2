import { Spinner as SpinnerChakra, SpinnerProps as SpinnerChakraProps } from '@chakra-ui/react'
import { classNames, makeCn } from '@shared/utils'

import style from './Spinner.module.scss'

type BaseSpinnerProps = SpinnerChakraProps

const cn = makeCn('Page', style)

export function BaseSpinner(props: BaseSpinnerProps) {
  const { className } = props

  return <SpinnerChakra className={classNames(cn(), className)} />
}
