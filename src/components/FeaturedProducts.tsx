import React from 'react';
import { Heart, ShoppingCart } from 'lucide-react';

export function FeaturedProducts() {
  const products = [
    {
      id: 1,
      name: 'Anel de Prata Clássico',
      price: 89.99,
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500',
      category: 'Anéis'
    },
    {
      id: 2,
      name: 'Colar de Corrente Delicada',
      price: 129.99,
      image: 'https://images.unsplash.com/photo-1676329947145-99145926d3eb?q=80&w=1958&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      category: 'Colares'
    },
    {
      id: 3,
      name: 'Brincos de Cravejados',
      price: 79.99,
      image: 'https://plus.unsplash.com/premium_photo-1680181362119-5c9bf196805f?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      category: 'Brincos'
    },
    {
      id: 4,
      name: 'Pulseira de Prata',
      price: 99.99,
      image: 'https://images.unsplash.com/photo-1676291055501-286c48bb186f?q=80&w=990&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      category: 'Pulseiras'
    },
    {
      id: 5,
      name: 'Conjunto de Anéis de Prata',
      price: 119.99,
      image: 'https://images.unsplash.com/photo-1765614766038-d036c338f028?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      category: 'Anéis'
    },
    {
      id: 6,
      name: 'Colar de Pérolas com Pingente',
      price: 149.99,
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500',
      category: 'Colares'
    },
    {
      id: 7,
      name: 'Conjunto de Brincos de Argola',
      price: 69.99,
      image: 'https://images.unsplash.com/photo-1765464281313-b3844388b316?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      category: 'Brincos'
    },
    {
      id: 8,
      name: 'Bracelete Largo Moderno',
      price: 159.99,
      image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=500',
      category: 'Pulseiras'
    }
];

  return (
    <section className="py-16 px-4 bg-vinho-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl mb-3">Nova Coleção</h2>
          <p className="text-vinho-600">Peças escolhidas para você</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div className="relative aspect-square bg-vinho-100 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <button className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md hover:bg-vinho-100 transition-colors opacity-0 group-hover:opacity-100">
                  <Heart className="w-5 h-5 text-vinho-700" />
                </button>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="w-full bg-white text-vinho-900 py-2 rounded flex items-center justify-center gap-2 hover:bg-vinho-100 transition-colors text-sm">
                    <ShoppingCart className="w-4 h-4" />
                    Adicionar ao Carrinho
                  </button>
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-vinho-500 mb-1">{product.category}</p>
                <h3 className="text-sm mb-2">{product.name}</h3>
                <p className="text-lg">R${product.price}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="bg-vinho-700 text-white px-8 py-3 hover:bg-vinho-800 transition-colors">
            Ver Todos os Produtos
          </button>
        </div>
      </div>
    </section>
  );
}
