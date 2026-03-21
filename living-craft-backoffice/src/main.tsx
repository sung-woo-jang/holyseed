import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { App, Providers } from '@/app'
// Styles
import '@/shared/styles/index.css'

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <Providers>
        <App />
      </Providers>
    </StrictMode>
  )
}
