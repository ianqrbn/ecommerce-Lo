import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { ProdutoFormModal } from '../../components/admin/ProdutoFormModal';

export default function ProdutosAdmin() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<any>(null);

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('data_criacao', { ascending: false });

      if (error) throw error;
      setProdutos(data || []);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${nome}"?\nEsta ação não pode ser desfeita.`)) {
      try {
        const { error } = await supabase.from('produtos').delete().eq('id', id);
        if (error) throw error;
        setProdutos(produtos.filter((p) => p.id !== id));
      } catch (err) {
        console.error('Erro ao excluir produto:', err);
        alert('Erro ao excluir produto.');
      }
    }
  };

  const handleNovoProduto = () => {
    setProdutoEditando(null);
    setIsModalOpen(true);
  };

  const handleEditarProduto = (produto: any) => {
    setProdutoEditando(produto);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setProdutoEditando(null);
  };

  const handleModalSave = () => {
    fetchProdutos(); // Recarrega a lista
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
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Produtos</h1>
        <button onClick={handleNovoProduto} className="bg-vinho-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-vinho-700 transition-colors">
          <Plus className="w-4 h-4" />
          Novo Produto
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-600">
              <th className="p-4 font-medium">Produto</th>
              <th className="p-4 font-medium">Categoria</th>
              <th className="p-4 font-medium">Preço</th>
              <th className="p-4 font-medium">Estoque</th>
              <th className="p-4 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {produtos.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  Nenhum produto cadastrado.
                </td>
              </tr>
            ) : (
              produtos.map((produto) => (
                <tr key={produto.id} className="hover:bg-gray-50">
                  <td className="p-4 flex items-center gap-3">
                    {produto.imagem_principal || produto.imagem_url ? (
                      <img src={produto.imagem_principal || produto.imagem_url} alt={produto.nome} className="w-10 h-10 object-cover rounded" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 flex items-center justify-center rounded text-gray-400">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                    <span className="font-medium text-gray-900">{produto.nome}</span>
                  </td>
                  <td className="p-4 text-gray-600 text-sm">{produto.categoria_nome || '-'}</td>
                  <td className="p-4 text-gray-900 font-medium">
                    R$ {Number(produto.preco).toFixed(2).replace('.', ',')}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${produto.estoque > 5 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                      {produto.estoque} un
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEditarProduto(produto)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Editar">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(produto.id, produto.nome)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Excluir">
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

      <ProdutoFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        produto={produtoEditando}
      />
    </div>
  );
}
