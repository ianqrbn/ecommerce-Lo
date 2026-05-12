import React from 'react';

export function CategoryShowcase() {
  const categories = [
    {
      title: 'Anéis',
      image: 'https://images.unsplash.com/photo-1656010280162-772358d9f4ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaWx2ZXIlMjByaW5ncyUyMGpld2Vscnl8ZW58MXx8fHwxNzY1ODMzNDIxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      description: 'Peças elegantes e clássicas'
    },
    {
      title: 'Colares',
      image: 'https://images.unsplash.com/photo-1694803121898-416958c0b385?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      description: 'Modelos atemporais'
    },
    {
      title: 'Brincos',
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1080',
      description: 'Argolas, cravejados e gotas'
    }
  ];

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl mb-3">COMPRE POR CATEGORIA</h2>
          <p className="text-vinho-600">Descubra Nossas Coleções</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <div
              key={index}
              className="group relative overflow-hidden cursor-pointer bg-vinho-100 rounded-lg"
            >
              <div className="relative w-full h-full bg-vinho-100 overflow-hidden">
                <img
                  src={category.image}
                  alt={category.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white bg-vinho-700">
                <h3 className="text-2xl mb-2">{category.title}</h3>
                <p className="text-sm mb-4">{category.description}</p>
                <button className="border border-white px-6 py-2 text-sm hover:bg-white hover:text-vinho-900 transition-all duration-300">
                  Explorar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
