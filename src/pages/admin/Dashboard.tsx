import React from 'react';

export default function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Vendas no Mês</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">R$ 0,00</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Pedidos Pendentes</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Produtos Cadastrados</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">-</p>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-64 flex items-center justify-center">
        <p className="text-gray-400">Gráficos em breve...</p>
      </div>
    </div>
  );
}
