import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import App from './App'
import ExecutivePriorityPage from './ExecutivePriorityPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/executive-priority" element={<ExecutivePriorityPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
