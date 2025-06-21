import { Icon } from '@components/ui/icon'
import { BrowserRouter, } from 'react-router-dom'
import { LanguageSwitcher } from '@components/ui'
import { Translations } from '@providers/translations'
import './i18n/config'
import style from './App.module.css'

const App = () => {

  return (
    <BrowserRouter>
      <Translations>
      <div className={style.app}>
        app
        <Icon name={'close'} />
        <LanguageSwitcher />
      </div>
      </Translations>
    </BrowserRouter>
  )
}

export default App
