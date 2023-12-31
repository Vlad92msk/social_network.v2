'use client'

import { CacheProvider } from '@chakra-ui/next-js'
import { ChakraProvider } from '@chakra-ui/react'

export function ChakraUI({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider>
      <ChakraProvider disableGlobalStyle>
        {children}
      </ChakraProvider>
    </CacheProvider>
  )
}
