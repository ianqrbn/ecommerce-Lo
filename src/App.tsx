import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Checkout from './pages/Checkout'

import Perfil from './pages/Perfil'
import Category from './pages/Category'
import { CartDrawer } from './components/CartDrawer'

function App() {
  return (
    <>
      <CartDrawer />
      <Routes>
        
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/categoria/:slug" element={<Category />} />
        <Route path="/busca" element={<Category />} />
        
        {/* Exemplo de rota 404*/}
        <Route path="*" element={<h1>Página não encontrada</h1>} />
      </Routes>
    </>
  )
}

export default App