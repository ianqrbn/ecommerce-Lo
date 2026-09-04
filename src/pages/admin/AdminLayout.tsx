import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Settings, LogOut, Store, FileText, Tag, Ticket, RotateCcw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminLayout() {
  const { signOut } = useAuth();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Pedidos', path: '/admin/pedidos', icon: FileText },
    { name: 'Devoluções', path: '/admin/devolucoes', icon: RotateCcw },
    { name: 'Produtos', path: '/admin/produtos', icon: Package },
    { name: 'Categorias', path: '/admin/categorias', icon: Tag },
    { name: 'Cupons', path: '/admin/cupons', icon: Ticket },
    { name: 'Configurações', path: '/admin/configuracoes', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-vinho-900 text-white flex flex-col">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 text-xl font-serif font-bold text-vinho-100 hover:text-white transition-colors">
            <Store className="w-6 h-6" />
            Loja Admin
          </Link>
        </div>
        
        <nav className="flex-1 mt-6">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                      isActive 
                        ? 'bg-vinho-800 text-white border-l-4 border-white' 
                        : 'text-vinho-200 hover:bg-vinho-800 hover:text-white border-l-4 border-transparent'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 mt-auto">
          <button 
            onClick={signOut}
            className="flex w-full items-center gap-3 px-4 py-3 text-vinho-200 hover:bg-vinho-800 hover:text-white transition-colors rounded"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair do Painel</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
