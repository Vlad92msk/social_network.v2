'use client'

import React, { PropsWithChildren, useMemo } from 'react'
import { TabOption, TabPanel, Tabs, TabsList } from '@ui/common/Tabs'
import { makeCn } from '@utils/others'
import style from './ProfilePageTab.module.scss'

const cn = makeCn('ProfilePageTab', style)

export interface ExampleProps {
  name: string;
  content: React.ReactElement;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ProfileTabItem(props: ExampleProps) {
  return null
}

interface ExampleModuleProps extends PropsWithChildren {
  activeTab?: string;
}

export function ProfileTab(props: ExampleModuleProps) {
  const { activeTab, children } = props
  const columns = useMemo(
    () => React.Children.toArray(children).filter(
      (child): child is React.ReactElement<ExampleProps> => React.isValidElement(child),
    ),
    [children],
  )

  return (
    <Tabs
      contextProps={{ activeTab, tabsType: 'Button', tabsSize: 'medium' }}
      className={cn()}
    >
      <TabsList className={cn('ButtonsList')} orientation="horizontal">
        {columns?.map((column) => {
          const columnProps = column.props
          const { name } = columnProps
          const nameTrim = name.trim()
          return <TabOption key={nameTrim} value={nameTrim} title={nameTrim} />
        })}
      </TabsList>

      {columns?.map((column) => {
        const columnProps = column.props
        const { name, content } = columnProps
        const nameTrim = name.trim()

        return (
          <TabPanel className={cn('Panel')} key={nameTrim} value={nameTrim}>
            {content}
          </TabPanel>
        )
      })}
    </Tabs>
  )
}
