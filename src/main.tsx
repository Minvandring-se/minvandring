import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import '@fontsource-variable/fraunces/wght.css'
import '@fontsource-variable/inter/wght.css'
import '@fontsource-variable/inter/wght-italic.css'
import '@fontsource-variable/montserrat/wght.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
