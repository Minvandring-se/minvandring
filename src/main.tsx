import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import '@fontsource-variable/fraunces/wght.css'
import '@fontsource-variable/inter/wght.css'
import '@fontsource-variable/inter/wght-italic.css'
import '@fontsource-variable/montserrat/wght.css'
import './index.css'
import App from './App.tsx'
import { startaUppdateringar, webblasaren } from './lib/uppdatering'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

// Service workern finns bara i den byggda appen.
if (import.meta.env.PROD) void startaUppdateringar(webblasaren())
