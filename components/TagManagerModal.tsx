
import React, { useState } from 'react';
import { X, Plus, Tag as TagIcon, CheckCircle2, AlertCircle, Pencil, Trash2, Check } from 'lucide-react';
import { Language, AppFontSize } from '../types';
import { getTranslation } from '../translations';

interface TagManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  tags: string[];
  onUpdateTags: (tags: string[]) => void;
  fontSize?: AppFontSize;
}

export const TagManagerModal: React.FC<TagManagerModalProps> = ({ 
  isOpen, onClose, language, tags, onUpdateTags, fontSize = 'medium'
}) => {
  const t = (key: any) => getTranslation(language, key);
  const [newTag, setNewTag] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  if (!isOpen) return null;

  const showFeedback = (type: 'success' | 'error', message: string) => { 
    setFeedback({ type, message }); 
    setTimeout(() => setFeedback(null), 3000); 
  };

  const handleAddTag = () => {
    const name = newTag.trim();
    if (!name) return;
    if (tags.some(t => t.toLowerCase() === name.toLowerCase())) { 
      showFeedback('error', t('tag_already_exists')); 
      return; 
    }
    onUpdateTags([...tags, name].sort());
    setNewTag('');
    showFeedback('success', t('tag_added'));
  };

  const handleDeleteTag = (index: number) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    onUpdateTags(newTags);
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditingValue(tags[index]);
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    const val = editingValue.trim();
    if (!val) return;
    
    const newTags = [...tags];
    newTags[editingIndex] = val;
    onUpdateTags(newTags.sort());
    setEditingIndex(null);
  };

  const getFontSizeClasses = (size: AppFontSize) => {
    switch(size) {
      case 'small': return { base: 'text-xs', label: 'text-[9px]', xl: 'text-base' };
      case 'large': return { base: 'text-base', label: 'text-[11px]', xl: 'text-xl' };
      case 'medium':
      default: return { base: 'text-sm', label: 'text-[10px]', xl: 'text-lg' };
    }
  };

  const fs = getFontSizeClasses(fontSize as AppFontSize);
  const inputClass = `flex-1 bg-[var(--theme-bg-soft)] dark:bg-stone-800 border-2 border-[var(--theme-border)] rounded-xl px-4 py-3 shadow-sm focus:border-[var(--theme-primary)] outline-none transition-all ${fs.base}`;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-stone-900 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-white dark:bg-stone-800/50">
          <h2 className={`font-serif font-bold text-[var(--theme-primary)] dark:text-stone-100 ${fs.xl}`}>{t('manage_tags')}</h2>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-full bg-white dark:bg-stone-800 shadow-sm transition-colors"><X size={20}/></button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6 no-scrollbar pb-10">
          {feedback && (
            <div className={`p-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 ${feedback.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30'}`}>
              {feedback.type === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}<span className={`font-bold ${fs.base}`}>{feedback.message}</span>
            </div>
          )}
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-stone-400 dark:text-stone-500 mb-1"><TagIcon size={16}/><span className={`font-bold uppercase tracking-widest ${fs.label}`}>{t('add_tag')}</span></div>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newTag} 
                onChange={(e) => setNewTag(e.target.value)} 
                placeholder={t('new_tag_placeholder')} 
                className={inputClass} 
              />
              <button onClick={handleAddTag} disabled={!newTag.trim()} className="bg-[var(--theme-primary)] dark:bg-[var(--theme-primary-dark)] text-white p-3 rounded-xl shadow-lg disabled:opacity-50 active:scale-95 transition-all"><Plus size={20}/></button>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2 text-stone-400 dark:text-stone-500 mb-1"><TagIcon size={16}/><span className={`font-bold uppercase tracking-widest ${fs.label}`}>Liste</span></div>
            <div className="space-y-2">
              {tags.length > 0 ? (
                tags.map((tag, index) => (
                  <div key={index} className="flex items-center gap-2 bg-stone-50 dark:bg-stone-800/50 p-2 rounded-xl border border-stone-100 dark:border-stone-800 group">
                    {editingIndex === index ? (
                      <>
                        <input 
                          type="text" 
                          autoFocus
                          value={editingValue} 
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="flex-1 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg px-3 py-1 text-sm outline-none"
                        />
                        <button onClick={saveEdit} className="p-2 text-emerald-600 dark:text-emerald-400"><Check size={18}/></button>
                        <button onClick={() => setEditingIndex(null)} className="p-2 text-stone-400"><X size={18}/></button>
                      </>
                    ) : (
                      <>
                        <span className={`flex-1 font-medium text-stone-700 dark:text-stone-300 px-2 ${fs.base}`}>{tag}</span>
                        <button onClick={() => startEditing(index)} className="p-2 text-stone-400 hover:text-[var(--theme-primary)] transition-colors"><Pencil size={16}/></button>
                        <button onClick={() => handleDeleteTag(index)} className="p-2 text-stone-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <p className={`text-center py-4 text-stone-400 italic ${fs.base}`}>{t('no_tags_listed')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};