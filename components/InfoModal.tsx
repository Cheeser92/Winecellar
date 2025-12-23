
import React from 'react';
import { X, Heart, Mail } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-stone-900 rounded-3xl w-full max-w-xs p-8 shadow-2xl flex flex-col items-center text-center transition-all animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1">
          <X size={20} />
        </button>
        
        <div className="w-20 h-20 bg-rose-900 dark:bg-rose-700 rounded-2xl shadow-xl flex items-center justify-center mb-6">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" className="w-12 h-12">
                <path d="M512 200c-35 0-64 29-64 64v136c-77 37-128 115-128 205v300c0 35 29 64 64 64h256c35 0 64-29 64-64V605c0-90-51-168-128-205V264c0-35-29-64-64-64z" fill="#ffffff"/>
            </svg>
        </div>

        <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-1">My Wine Cellar</h2>
        <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-4">v1.0 • 2025</p>
        
        <div className="space-y-4 mb-6">
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                Développé entièrement avec <br/>
                <span className="font-bold text-rose-900 dark:text-rose-400">Google AI Studio</span>
            </p>
            <div className="flex items-center justify-center gap-2 text-stone-400 dark:text-stone-600">
                <div className="h-px w-8 bg-stone-200 dark:bg-stone-800"></div>
                <Heart size={14} className="fill-current"/>
                <div className="h-px w-8 bg-stone-200 dark:bg-stone-800"></div>
            </div>
            <p className="text-sm font-serif italic text-stone-800 dark:text-stone-200 font-bold">
                Cheeser92
            </p>
        </div>

        <div className="w-full mb-8 p-5 bg-white dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm">
          <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed mb-4 text-center">
            Un commentaire, une remarque, un remerciement ? Envoyez un message. Les demandes de modifications seront traitées en fonction de mon temps libre.
          </p>
          <button 
            onClick={() => window.open('mailto:cheeser92@gmail.com', '_blank')}
            className="w-full bg-stone-50 dark:bg-stone-800 text-rose-900 dark:text-rose-400 font-bold py-3 px-4 rounded-xl border border-rose-100 dark:border-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/20 transition flex items-center justify-center gap-2 shadow-sm active:scale-95"
          >
            <Mail size={16} />
            Me contacter
          </button>
        </div>

        <button 
          onClick={onClose}
          className="w-full bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold py-3 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700 transition shadow-sm"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};
