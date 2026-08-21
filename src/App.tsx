import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Checkout from './pages/Checkout'

import Perfil from './pages/Perfil'
import Category from './pages/Category'
import Favoritos from './pages/Favoritos'
import Product from './pages/Product'
import Sobre from './pages/Sobre'
import Contato from './pages/Contato'
import Devolucoes from './pages/Devolucoes'
import FAQ from './pages/FAQ'
import Envio from './pages/Envio'
import Termos from './pages/Termos'
import { CartDrawer } from './components/CartDrawer'
import { AdminRoute } from './components/AdminRoute'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import Configuracoes from './pages/admin/Configuracoes'
import ProdutosAdmin from './pages/admin/ProdutosAdmin'
import CategoriasAdmin from './pages/admin/CategoriasAdmin'
import PedidosAdmin from './pages/admin/PedidosAdmin'

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
        <Route path="/produto/:id" element={<Product />} />
        <Route path="/favoritos" element={<Favoritos />} />

        {/* Páginas Institucionais */}
        <Route path="/sobre" element={<Sobre />} />
        <Route path="/contato" element={<Contato />} />
        <Route path="/devolucoes" element={<Devolucoes />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/envio" element={<Envio />} />
        <Route path="/termos" element={<Termos />} />
        
        {/* Exemplo de rota 404*/}
        <Route path="*" element={<h1>Página não encontrada</h1>} />

        {/* Rotas Administrativas */}
        <Route path="/admin" element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="produtos" element={<ProdutosAdmin />} />
            <Route path="categorias" element={<CategoriasAdmin />} />
            <Route path="pedidos" element={<PedidosAdmin />} />
            <Route path="configuracoes" element={<Configuracoes />} />
          </Route>
        </Route>
      </Routes>
    </>
  )
}

export default App