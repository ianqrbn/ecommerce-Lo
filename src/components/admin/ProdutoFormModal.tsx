import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Upload, Loader2, Plus, Trash2, GripVertical } from 'lucide-react';

interface ProdutoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  produto?: any;
}

export function ProdutoFormModal({ isOpen, onClose, onSave, produto }: ProdutoFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco: '',
    estoque: '',
    peso_prata: '',
    imagem_principal: '',
  });

  const [imagensSecundarias, setImagensSecundarias] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [selectedCategorias, setSelectedCategorias] = useState<any[]>([]);

  useEffect(() => {
    fetchAllCategorias();
  }, []);

  const fetchAllCategorias = async () => {
    const { data } = await supabase.from('categorias').select('id, nome').order('nome');
    if (data) setCategorias(data);
  };

  useEffect(() => {
    if (isOpen) {
      if (produto) {
        setFormData({
          nome: produto.nome || '',
          descricao: produto.descricao || '',
          preco: produto.preco?.toString() || '',
          estoque: produto.estoque?.toString() || '',
          peso_prata: produto.peso_prata?.toString() || '',
          imagem_principal: produto.imagem_principal || '',
        });
        fetchImagensSecundarias(produto.id);
        fetchSelectedCategorias(produto.id);
      } else {
        setFormData({
          nome: '',
          descricao: '',
          preco: '',
          estoque: '',
          peso_prata: '',
          imagem_principal: '',
        });
        setImagensSecundarias([]);
        setSelectedCategorias([]);
      }
      setErrorMsg('');
    }
  }, [isOpen, produto]);

  const fetchSelectedCategorias = async (produtoId: string) => {
    const { data } = await supabase.from('cat_prod').select('cat_id').eq('prod_id', produtoId);
    if (data) {
      setSelectedCategorias(data.map(d => d.cat_id));
    } else {
      setSelectedCategorias([]);
    }
  };

  const fetchImagensSecundarias = async (produtoId: string) => {
    const { data, error } = await supabase
      .from('imagens_produto')
      .select('*')
      .eq('produto_id', produtoId)
      .order('ordem', { ascending: true });

    if (!error && data) {
      setImagensSecundarias(data);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setErrorMsg('');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `produtos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('produtos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('produtos').getPublicUrl(filePath);

      if (index !== undefined) {
        // Atualiza imagem secundária
        const newImages = [...imagensSecundarias];
        newImages[index].url = data.publicUrl;
        setImagensSecundarias(newImages);
      } else {
        // Atualiza imagem principal
        setFormData((prev) => ({ ...prev, imagem_principal: data.publicUrl }));
      }
    } catch (error: any) {
      console.error('Erro no upload:', error);
      setErrorMsg('Erro ao fazer upload da imagem.');
    } finally {
      setUploadingImage(false);
    }
  };

  const addImagemSecundaria = () => {
    setImagensSecundarias([...imagensSecundarias, { url: '', ordem: imagensSecundarias.length + 1 }]);
  };

  const removeImagemSecundaria = (index: number) => {
    const newImages = [...imagensSecundarias];
    newImages.splice(index, 1);
    // Reordenar
    newImages.forEach((img, i) => img.ordem = i + 1);
    setImagensSecundarias(newImages);
  };

  const handleImagemSecundariaChange = (index: number, url: string) => {
    const newImages = [...imagensSecundarias];
    newImages[index].url = url;
    setImagensSecundarias(newImages);
  };

  const toggleCategoria = (catId: any) => {
    if (selectedCategorias.includes(catId)) {
      setSelectedCategorias(selectedCategorias.filter(id => id !== catId));
    } else {
      setSelectedCategorias([...selectedCategorias, catId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        nome: formData.nome,
        descricao: formData.descricao,
        preco: parseFloat(formData.preco) || 0,
        estoque: parseInt(formData.estoque) || 0,
        peso_prata: parseFloat(formData.peso_prata) || null,
        imagem_principal: formData.imagem_principal,
        ativo: true,
      };

      let produtoId = produto?.id;

      if (produtoId) {
        // Atualizar produto existente
        const { error } = await supabase.from('produtos').update(payload).eq('id', produtoId);
        if (error) throw error;
      } else {
        // Criar novo produto
        const { data, error } = await supabase.from('produtos').insert([payload]).select('id').single();
        if (error) throw error;
        produtoId = data.id;
      }

      // Sincronizar imagens secundárias
      // Para simplificar, deletamos todas as antigas e inserimos as novas
      if (produtoId) {
        await supabase.from('imagens_produto').delete().eq('produto_id', produtoId);
        
        const validImages = imagensSecundarias.filter(img => img.url.trim() !== '');
        if (validImages.length > 0) {
          const insertData = validImages.map((img, index) => ({
            produto_id: produtoId,
            url: img.url,
            ordem: index + 1
          }));
          const { error: imgError } = await supabase.from('imagens_produto').insert(insertData);
          if (imgError) throw imgError;
        }

        // Sincronizar categorias
        await supabase.from('cat_prod').delete().eq('prod_id', produtoId);
        if (selectedCategorias.length > 0) {
          const catInsertData = selectedCategorias.map(catId => ({
            prod_id: produtoId,
            cat_id: catId
          }));
          const { error: catError } = await supabase.from('cat_prod').insert(catInsertData);
          if (catError) throw catError;
        }
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error);
      setErrorMsg(error.message || 'Erro ao salvar produto.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {produto ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 rounded text-sm">
              {errorMsg}
            </div>
          )}

          <form id="produto-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto *</label>
                <input required type="text" name="nome" value={formData.nome} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md p-2" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea name="descricao" rows={3} value={formData.descricao} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md p-2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$) *</label>
                <input required type="number" step="0.01" name="preco" value={formData.preco} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md p-2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estoque (Unid.) *</label>
                <input required type="number" name="estoque" value={formData.estoque} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md p-2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peso (Gramas)</label>
                <input type="number" name="peso_prata" value={formData.peso_prata} onChange={handleInputChange} placeholder="Ex: 300" className="w-full border border-gray-300 rounded-md p-2" />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Categorias do Produto</h3>
              {categorias.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Nenhuma categoria cadastrada. Crie categorias primeiro no menu lateral.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {categorias.map(cat => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded border border-transparent hover:border-gray-200 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={selectedCategorias.includes(cat.id)}
                        onChange={() => toggleCategoria(cat.id)}
                        className="w-4 h-4 rounded border-gray-300 text-vinho-600 focus:ring-vinho-600"
                      />
                      <span className="text-sm text-gray-700">{cat.nome}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-6 mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Imagem Principal</h3>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-gray-500 mb-1">URL da Imagem</label>
                  <input type="text" name="imagem_principal" value={formData.imagem_principal} onChange={handleInputChange} placeholder="Cole o link ou faça upload..." className="w-full border border-gray-300 rounded-md p-2" />
                </div>
                <div className="relative">
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <button type="button" disabled={uploadingImage} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors whitespace-nowrap disabled:opacity-50">
                    {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Fazer Upload
                  </button>
                </div>
              </div>
              {formData.imagem_principal && (
                <div className="mt-4 w-24 h-24 border rounded overflow-hidden">
                  <img src={formData.imagem_principal} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-6 mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Galeria de Imagens (Secundárias)</h3>
                <button type="button" onClick={addImagemSecundaria} className="text-sm flex items-center gap-1 text-vinho-600 hover:text-vinho-800">
                  <Plus className="w-4 h-4" /> Adicionar Imagem
                </button>
              </div>

              <div className="space-y-4">
                {imagensSecundarias.map((img, index) => (
                  <div key={index} className="flex items-center gap-4 bg-gray-50 p-3 rounded border border-gray-100">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                    {img.url && (
                      <img src={img.url} alt={`Secundária ${index}`} className="w-10 h-10 object-cover rounded border" />
                    )}
                    <input 
                      type="text" 
                      value={img.url} 
                      onChange={(e) => handleImagemSecundariaChange(index, e.target.value)} 
                      placeholder="URL da imagem..." 
                      className="flex-1 border border-gray-300 rounded p-2 text-sm" 
                    />
                    <div className="relative w-10 h-10 flex-shrink-0">
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, index)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <button type="button" className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition-colors">
                        <Upload className="w-4 h-4" />
                      </button>
                    </div>
                    <button type="button" onClick={() => removeImagemSecundaria(index)} className="text-red-500 hover:text-red-700 p-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {imagensSecundarias.length === 0 && (
                  <p className="text-sm text-gray-500 italic">Nenhuma imagem secundária adicionada.</p>
                )}
              </div>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md transition-colors">
            Cancelar
          </button>
          <button form="produto-form" type="submit" disabled={loading || uploadingImage} className="flex items-center gap-2 px-6 py-2 bg-vinho-600 text-white rounded-md hover:bg-vinho-700 transition-colors disabled:opacity-50">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Salvar Produto
          </button>
        </div>
      </div>
    </div>
  );
}
