import React, { useState } from 'react';
import { X, Layers, Sparkles, Trash2 } from 'lucide-react';
import { useTaskFlow } from '../../context/TaskFlowContext';
import { Epic } from '../../types';

export const EpicModal: React.FC = () => {
  const { modalState, closeModal, createEpic, updateEpic, deleteEpic } = useTaskFlow();

  const isEditing = Boolean(modalState.data?.id);
  const initialEpic: Partial<Epic> = modalState.data || {};

  const [title, setTitle] = useState(initialEpic.title || '');
  const [description, setDescription] = useState(initialEpic.description || '');
  const [vision, setVision] = useState(initialEpic.vision || '');
  const [color, setColor] = useState(initialEpic.color || '#3b82f6');
  const [iconName, setIconName] = useState(initialEpic.iconName || 'Layers');

  const colorPresets = [
    { label: 'Azul (Tech/Carreira)', hex: '#3b82f6' },
    { label: 'Esmeralda (Finanças)', hex: '#10b981' },
    { label: 'Vermelho (Saúde/Foco)', hex: '#ef4444' },
    { label: 'Roxo (Igreja/Fé)', hex: '#8b5cf6' },
    { label: 'Âmbar (Estudos)', hex: '#f59e0b' },
    { label: 'Rosa (Família)', hex: '#ec4899' },
  ];

  const iconOptions = [
    { label: 'Geral', name: 'Layers' },
    { label: 'Engenharia', name: 'Cpu' },
    { label: 'Finanças', name: 'Coins' },
    { label: 'Saúde', name: 'Activity' },
    { label: 'Espiritualidade', name: 'HeartHandshake' },
    { label: 'Estudos', name: 'BookOpen' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      vision: vision.trim(),
      color,
      iconName,
    };

    if (isEditing && initialEpic.id) {
      updateEpic(initialEpic.id, payload);
    } else {
      createEpic(payload);
    }

    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 sm:p-5 border-b border-[#30363d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center border"
              style={{ backgroundColor: `${color}20`, borderColor: `${color}40`, color }}
            >
              <Layers className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white">
              {isEditing ? 'Editar Área / Épico' : 'Nova Área Fundamental (Épico/Spec)'}
            </h2>
          </div>

          <button
            onClick={closeModal}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#21262d]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Nome da Área Fundamental <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Igreja & Espiritualidade, Finanças & Liberdade, Carreira..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="tf-input w-full py-2 text-sm"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Descrição do Escopo Operacional
            </label>
            <textarea
              rows={2}
              placeholder="Como esta área funciona no seu dia a dia..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="tf-input w-full py-1.5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Visão de Sucesso / Objetivo Principal
            </label>
            <textarea
              rows={2}
              placeholder="O que define o sucesso e realização máxima nesta área..."
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              className="tf-input w-full py-1.5"
            />
          </div>

          {/* Color & Icon */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Cor Representativa
              </label>
              <div className="flex flex-wrap gap-1.5">
                {colorPresets.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      color === c.hex ? 'scale-110 border-white' : 'border-transparent opacity-70'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Ícone Temático
              </label>
              <select
                value={iconName}
                onChange={(e) => setIconName(e.target.value)}
                className="tf-input w-full py-1.5"
              >
                {iconOptions.map((opt) => (
                  <option key={opt.name} value={opt.name}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-[#30363d] flex items-center justify-between">
            {isEditing ? (
              <button
                type="button"
                onClick={() => {
                  if (initialEpic.id && window.confirm(`Excluir área "${title}"?`)) {
                    deleteEpic(initialEpic.id);
                    closeModal();
                  }
                }}
                className="text-red-400 hover:text-red-300 flex items-center gap-1 text-xs"
              >
                <Trash2 className="w-4 h-4" /> Excluir
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-2">
              <button type="button" onClick={closeModal} className="tf-btn-secondary text-xs">
                Cancelar
              </button>
              <button type="submit" className="tf-btn-primary text-xs font-semibold px-4">
                {isEditing ? 'Salvar Alterações' : 'Criar Área / Épico'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
