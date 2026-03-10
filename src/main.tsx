import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './contexts/LanguageContext'
import { SqlVersionProvider } from './contexts/SqlVersionContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <SqlVersionProvider>
        <App />
      </SqlVersionProvider>
    </LanguageProvider>
  </StrictMode>,
)
