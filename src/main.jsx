import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Import global styles
import './utils/browser-compatibility.js'

// Import i18n configuration BEFORE App
import './i18n'

import './styles/global.css'
import './styles/components.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
