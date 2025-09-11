import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrimeReactProvider } from "primereact/api";
import App from './App.tsx'

// 1) PrimeReact styles
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css'

// 2) Tailwind
import './App.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrimeReactProvider>
        <App />
    </PrimeReactProvider>
  </StrictMode>,
)
