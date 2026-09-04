import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';

export function CartDrawer() {
  const { cart, cartTotal, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity } = useCart();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  return (
    <>
      {/* Overlay translúcido */}
      <div
        className="fixed inset-0 bg-black/50 z-[60] transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[60] flex flex-col transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-serif text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-vinho-700" />
            Seu Carrinho
          </h2>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-50 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-4">
              <ShoppingBag className="w-16 h-16 text-gray-200" />
              <p className="text-lg">Seu carrinho está vazio</p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-vinho-700 font-medium hover:text-vinho-800 transition-colors"
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {cart.map((item) => (
                <div key={item.cartItemId || item.id} className="flex gap-4">
                  {/* Imagem do Produto */}
                  <div className="w-20 h-24 flex-shrink-0 bg-gray-50 rounded-md overflow-hidden">
                    <img
                      src={item.imagem_principal || 'https://via.placeholder.com/150'}
                      alt={item.nome}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Detalhes do Produto */}
                  <div className="flex flex-col flex-1 justify-between">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{item.nome}</h3>
                      <button
                        onClick={() => removeFromCart(item.cartItemId || item.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {item.tamanho && (
                      <p className="text-xs text-gray-500 mt-0.5">Tamanho: {item.tamanho}</p>
                    )}

                    <div className="text-sm font-semibold text-gray-900 mt-1">
                      R$ {item.preco.toFixed(2).replace('.', ',')}
                    </div>

                    {/* Controles de Quantidade */}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-gray-200 rounded-md">
                        <button
                          onClick={() => updateQuantity(item.cartItemId || item.id, item.quantidade - 1)}
                          className="px-2 py-1 text-gray-500 hover:text-gray-900 transition-colors focus:outline-none"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 py-1 text-sm font-medium text-gray-900 min-w-[2rem] text-center">
                          {item.quantidade}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.cartItemId || item.id, item.quantidade + 1)}
                          className="px-2 py-1 text-gray-500 hover:text-gray-900 transition-colors focus:outline-none"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-gray-100 p-6 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-lg font-bold text-gray-900">
                R$ {cartTotal.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-6 text-center">
              Frete e impostos calculados no checkout.
            </p>
            <button
              className="w-full bg-vinho-700 text-white py-3 px-4 rounded-md font-medium hover:bg-vinho-800 transition-colors flex justify-center items-center gap-2"
              onClick={() => {
                setIsCartOpen(false);
                navigate('/checkout');
              }}
            >
              Finalizar Compra
            </button>
          </div>
        )}
      </div>
    </>
  );
}
