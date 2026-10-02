import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Render free plan "uyg'otish" — birinchi so'rov sekin bo'lmasligi uchun
if (!import.meta.env.DEV) {
  fetch('https://maktab287-backend.onrender.com/').catch(() => {});
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
