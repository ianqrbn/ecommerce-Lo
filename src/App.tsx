import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'

function App() {
  return (
    <Routes>
      
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      
      {/* Exemplo de rota 404*/}
      <Route path="*" element={<h1>Página não encontrada</h1>} />
    </Routes>
  )
}

export default App