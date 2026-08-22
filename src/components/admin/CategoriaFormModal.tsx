import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Upload, Loader2 } from 'lucide-react';

interface CategoriaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  categoria?: any;
}

export function CategoriaFormModal({ isOpen, onClose, onSave, categoria }: CategoriaFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    slug: '',
    imagem_url: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (categoria) {
        setFormData({
          nome: categoria.nome || '',
          descricao: categoria.descricao || '',
          slug: categoria.slug || '',
          imagem_url: categoria.imagem_url || '',
        });
      } else {
        setFormData({
          nome: '',
          descricao: '',
          slug: '',
          imagem_url: '',
        });
      }
      setErrorMsg('');
    }
  }, [isOpen, categoria]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Auto-gerar slug a partir do nome se estiver criando nova e o slug estiver vazio (ou se for o mesmo)
    if (name === 'nome' && !categoria) {
      const generatedSlug = value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
        
      setFormData((prev) => ({ ...prev, [name]: value, slug: generatedSlug }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setErrorMsg('');

      const fileExt = file.name.split('.').pop();
      const fileName = `cat_${Math.random()}.${fileExt}`;
      const filePath = `categorias/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('produtos') // Usando o mesmo bucket para simplificar, mas em pasta diferente se quiser, ou mesma.
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('produtos').getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, imagem_url: data.publicUrl }));
    } catch (error: any) {
      console.error('Erro no upload:', error);
      setErrorMsg('Erro ao fazer upload da imagem.');
    } finally {
      setUploadingImage(false);
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
        slug: formData.slug,
        imagem_url: formData.imagem_url,
      };

      if (categoria?.id) {
        // Atualizar
        const { error } = await supabase.from('categorias').update(payload).eq('id', categoria.id);
        if (error) throw error;
      } else {
        // Criar
        const { error } = await supabase.from('categorias').insert([payload]);
        if (error) throw error;
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar categoria:', error);
      // Tratamento especial para slug duplicado (que normalmente é unique)
      if (error.code === '23505') {
         setErrorMsg('Já existe uma categoria com este Slug (URL). Tente outro.');
      } else {
         setErrorMsg(error.message || 'Erro ao salvar categoria.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {categoria ? 'Editar Categoria' : 'Nova Categoria'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 rounded text-sm">
              {errorMsg}
            </div>
          )}

          <form id="categoria-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Categoria *</label>
              <input required type="text" name="nome" value={formData.nome} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md p-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL amigável) *</label>
              <input required type="text" name="slug" value={formData.slug} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md p-2 bg-gray-50" />
              <p className="text-xs text-gray-500 mt-1">Como a categoria vai aparecer na barra de endereços: /categoria/<strong>{formData.slug || 'joias-autorais'}</strong></p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea name="descricao" rows={3} value={formData.descricao} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md p-2" />
            </div>

            <div className="border-t border-gray-100 pt-6 mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Imagem de Capa</h3>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-gray-500 mb-1">URL da Imagem</label>
                  <input type="text" name="imagem_url" value={formData.imagem_url} onChange={handleInputChange} placeholder="Cole o link ou faça upload..." className="w-full border border-gray-300 rounded-md p-2" />
                </div>
                <div className="relative">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <button type="button" disabled={uploadingImage} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors whitespace-nowrap disabled:opacity-50">
                    {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Fazer Upload
                  </button>
                </div>
              </div>
              {formData.imagem_url && (
                <div className="mt-4 w-full h-48 border rounded overflow-hidden">
                  <img src={formData.imagem_url} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md transition-colors">
            Cancelar
          </button>
          <button form="categoria-form" type="submit" disabled={loading || uploadingImage} className="flex items-center gap-2 px-6 py-2 bg-vinho-600 text-white rounded-md hover:bg-vinho-700 transition-colors disabled:opacity-50">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Salvar Categoria
          </button>
        </div>
      </div>
    </div>
  );
}
