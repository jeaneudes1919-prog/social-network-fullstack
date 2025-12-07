import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './context/ThemeContext.jsx' // <--- IMPORT

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider> {/* <--- ON ENGLOBE TOUT ICI */}
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)