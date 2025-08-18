import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrimeReactProvider } from "primereact/api";
import App from './App.tsx'

// 1) Tailwind
import './App.css'

// 2) PrimeReact styles
import 'primeicons/primeicons.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrimeReactProvider value={{unstyled: true}}>
        <App />
    </PrimeReactProvider>
  </StrictMode>,
)
