
import React from 'react';
import { X, Heart, Mail } from 'lucide-react';
import { AppFontSize, Language } from '../types';
import { getTranslation } from '../translations';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  fontSize?: AppFontSize;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, language, fontSize = 'medium' }) => {
  const t = (key: any) => getTranslation(language, key);
  if (!isOpen) return null;

  const getFontSizeClasses = (size: AppFontSize) => {
    switch(size) {
      case 'small': return { base: 'text-[10px]', lg: 'text-xs', xl: 'text-sm' };
      case 'large': return { base: 'text-sm', lg: 'text-base', xl: 'text-xl' };
      case 'medium':
      default: return { base: 'text-xs', lg: 'text-sm', xl: 'text-lg' };
    }
  };

  const fs = getFontSizeClasses(fontSize as AppFontSize);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-stone-900 rounded-3xl w-full max-w-xs p-8 shadow-2xl flex flex-col items-center text-center transition-all animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"><X size={20} /></button>
        <div className="w-20 h-20 bg-[var(--theme-primary)] dark:bg-[var(--theme-primary-dark)] rounded-2xl shadow-xl flex items-center justify-center mb-6">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" className="w-12 h-12"><path d="M512 200c-35 0-64 29-64 64v136c-77 37-128 115-128 205v300c0 35 29 64 64 64h256c35 0 64-29 64-64V605c0-90-51-168-128-205V264c0-35-29-64-64-64z" fill="#ffffff"/></svg>
        </div>
        <h2 className={`font-serif font-bold text-stone-900 dark:text-stone-100 mb-1 ${fs.xl}`}>{t('app_title')}</h2>
        <p className={`font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-4 ${fs.base}`}>v1.0 • 2025</p>
        <div className="space-y-4 mb-6">
            <p className={`text-stone-600 dark:text-stone-400 leading-relaxed ${fs.lg}`}>{t('info_modal_developed_by')}</p>
            <div className="flex items-center justify-center gap-2 text-stone-400 dark:text-stone-600"><div className="h-px w-8 bg-stone-200 dark:bg-stone-800"></div><Heart size={14} className="fill-current"/><div className="h-px w-8 bg-stone-200 dark:bg-stone-800"></div></div>
            <p className={`font-serif italic text-stone-800 dark:text-stone-200 font-bold ${fs.lg}`}>Cheeser92</p>
        </div>
        <div className="w-full mb-8 p-5 bg-white dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm">
          <p className={`text-stone-500 dark:text-stone-400 leading-relaxed mb-4 text-center ${fs.base}`}>{t('info_modal_contact_desc')}</p>
          <button onClick={() => window.open('mailto:cheeser92@gmail.com', '_blank')} className={`w-full bg-[var(--theme-bg-soft)] dark:bg-stone-800 text-[var(--theme-primary)] dark:text-rose-400 font-bold py-3 px-4 rounded-xl border border-[var(--theme-border)] dark:border-rose-900/30 hover:opacity-90 transition flex items-center justify-center gap-2 shadow-sm active:scale-95 ${fs.lg}`}><Mail size={16} />{t('info_modal_contact_button')}</button>
        </div>
        <button onClick={onClose} className={`w-full bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold py-3 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700 transition shadow-sm ${fs.lg}`}>{t('info_modal_close')}</button>
      </div>
    </div>
  );
};