import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App'
import reportWebVitals from './reportWebVitals'

import '@/styles/index.scss'
import 'draft-js/dist/Draft.css'
/* Выберите одну */
// import 'prismjs/themes/prism.css'           /* классическая светлая */
// import 'prismjs/themes/prism-dark.css'      /* темная */
// import 'prismjs/themes/prism-funky.css'     /* яркая */
// import 'prismjs/themes/prism-okaidia.css'   /* темная Okaidia */
// import 'prismjs/themes/prism-twilight.css'  /* Twilight */
// import 'prismjs/themes/prism-coy.css'       /* Coy */
// import 'prismjs/themes/prism-solarizedlight.css' /* Solarized Light */
import 'prismjs/themes/prism-tomorrow.css'  /* Tomorrow Night (популярная) */

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

reportWebVitals()


