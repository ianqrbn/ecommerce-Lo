import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  id: string;
  nome: string;
  preco: number;
  imagem_principal: string;
  quantidade: number;
}

export interface Coupon {
  id: string;
  codigo: string;
  tipo: 'porcentagem' | 'fixo';
  valor: number;
}

interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  cartDiscount: number;
  cartTotalWithDiscount: number;
  appliedCoupon: Coupon | null;
  setAppliedCoupon: (coupon: Coupon | null) => void;
  addToCart: (product: any, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('ecommerce-cart');
    const savedCoupon = localStorage.getItem('ecommerce-coupon');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart from local storage', e);
      }
    }
    if (savedCoupon) {
      try {
        setAppliedCoupon(JSON.parse(savedCoupon));
      } catch (e) {
        console.error('Failed to parse coupon from local storage', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to local storage when cart changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('ecommerce-cart', JSON.stringify(cart));
      if (appliedCoupon) {
        localStorage.setItem('ecommerce-coupon', JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem('ecommerce-coupon');
      }
    }
  }, [cart, appliedCoupon, isLoaded]);

  const addToCart = (product: any, quantity: number = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantidade: item.quantidade + quantity }
            : item
        );
      }
      
      const precoNumerico = typeof product.preco === 'string' ? parseFloat(product.preco) : product.preco;
      
      return [
        ...prevCart,
        {
          id: product.id,
          nome: product.nome,
          preco: precoNumerico,
          imagem_principal: product.imagem_principal,
          quantidade: quantity,
        },
      ];
    });
    
    // Automatically open the cart when an item is added
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantidade: quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const cartCount = cart.reduce((total, item) => total + item.quantidade, 0);
  const cartTotal = cart.reduce((total, item) => total + item.preco * item.quantidade, 0);
  
  const cartDiscount = appliedCoupon
    ? (appliedCoupon.tipo === 'porcentagem' ? cartTotal * (appliedCoupon.valor / 100) : appliedCoupon.valor)
    : 0;
    
  const cartTotalWithDiscount = Math.max(0, cartTotal - cartDiscount);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        cartTotal,
        cartDiscount,
        cartTotalWithDiscount,
        appliedCoupon,
        setAppliedCoupon,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
