import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { CategoriaFormModal } from '../../components/admin/CategoriaFormModal';

export default function CategoriasAdmin() {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<any>(null);

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      setCategorias(data || []);
    } catch (err) {
      console.error('Erro ao buscar categorias:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a categoria "${nome}"?\nProdutos vinculados a ela poderão ficar sem categoria.`)) {
      try {
        const { error } = await supabase.from('categorias').delete().eq('id', id);
        if (error) throw error;
        setCategorias(categorias.filter((c) => c.id !== id));
      } catch (err) {
        console.error('Erro ao excluir categoria:', err);
        alert('Erro ao excluir categoria.');
      }
    }
  };

  const handleNovaCategoria = () => {
    setCategoriaEditando(null);
    setIsModalOpen(true);
  };

  const handleEditarCategoria = (categoria: any) => {
    setCategoriaEditando(categoria);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setCategoriaEditando(null);
  };

  const handleModalSave = () => {
    fetchCategorias();
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-vinho-600" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Categorias</h1>
        <button onClick={handleNovaCategoria} className="bg-vinho-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-vinho-700 transition-colors">
          <Plus className="w-4 h-4" />
          Nova Categoria
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-600">
              <th className="p-4 font-medium w-16">Capa</th>
              <th className="p-4 font-medium">Nome</th>
              <th className="p-4 font-medium">Slug (URL)</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categorias.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  Nenhuma categoria cadastrada.
                </td>
              </tr>
            ) : (
              categorias.map((categoria) => (
                <tr key={categoria.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    {categoria.imagem_url ? (
                      <img src={categoria.imagem_url} alt={categoria.nome} className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 flex items-center justify-center rounded text-gray-400">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{categoria.nome}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{categoria.descricao}</div>
                  </td>
                  <td className="p-4 text-gray-600 font-mono text-sm">
                    /{categoria.slug}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEditarCategoria(categoria)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Editar">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(categoria.id, categoria.nome)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CategoriaFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        categoria={categoriaEditando}
      />
    </div>
  );
}
