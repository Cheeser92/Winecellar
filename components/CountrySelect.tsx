
import React, { useState, useRef, useEffect } from 'react';
import { Search, Globe, ChevronDown, Pencil, Eraser } from 'lucide-react';
import { Language, AppFontSize } from '../types';
import { getTranslation } from '../translations';

interface CountrySelectProps {
  value: string;
  countries: string[];
  onChange: (value: string) => void;
  onClear?: () => void;
  onEdit?: () => void;
  language: Language;
  className?: string;
  placeholder?: string;
  fontSize?: AppFontSize;
}

export const CountrySelect: React.FC<CountrySelectProps> = ({ 
  value, countries, onChange, onClear, onEdit, language, className, placeholder, fontSize = 'medium'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const t = (key: any) => getTranslation(language, key);

  const filteredCountries = countries.filter(c => c.toLowerCase().includes(searchTerm.toLowerCase()));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) { if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false); }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (country: string) => { onChange(country); setSearchTerm(''); setIsOpen(false); };

  const getFontSizeClasses = (size: AppFontSize) => {
    switch(size) {
      case 'small': return { base: 'text-[10px]', lg: 'text-xs', label: 'text-[9px]' };
      case 'large': return { base: 'text-sm', lg: 'text-base', label: 'text-[11px]' };
      case 'medium':
      default: return { base: 'text-xs', lg: 'text-sm', label: 'text-[10px]' };
    }
  };

  const fs = getFontSizeClasses(fontSize as AppFontSize);

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative group">
        <input type="text" value={value} readOnly onClick={() => setIsOpen(!isOpen)} placeholder={placeholder || (language === 'fr' ? 'Sélectionner un pays...' : 'Select country...')} className={`${className} cursor-pointer selection:bg-transparent pr-20`} />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {onClear && value && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onClear(); }} className="p-1 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors" title={language === 'fr' ? 'Effacer' : 'Clear'}><Eraser size={16} /></button>
          )}
          {onEdit && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 text-stone-400 hover:text-rose-900 dark:hover:text-rose-400 transition-colors bg-stone-50 dark:bg-stone-900 rounded-md border border-stone-200 dark:border-stone-700"><Pencil size={14} /></button>
          )}
          <div className="flex items-center gap-0.5 text-stone-400 pointer-events-none"><Globe size={16} /><ChevronDown size={14} /></div>
        </div>
      </div>
      {isOpen && (
        <div className="absolute z-[100] mt-1 w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="p-2 border-b border-stone-100 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
              <input type="text" autoFocus value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={language === 'fr' ? 'Rechercher...' : 'Search...'} className={`w-full pl-9 pr-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:ring-rose-500 focus:border-rose-500 outline-none ${fs.lg}`} />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto no-scrollbar">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button key={country} type="button" onClick={() => handleSelect(country)} className={`w-full text-left px-4 py-3 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors flex items-center justify-between ${fs.lg} ${value === country ? 'text-rose-900 dark:text-rose-400 font-bold bg-rose-50/50 dark:bg-rose-900/10' : 'text-stone-700 dark:text-stone-300'}`}>{country}{value === country && <div className="w-1.5 h-1.5 rounded-full bg-rose-900 dark:bg-rose-400"></div>}</button>
              ))
            ) : (
              <div className="px-4 py-8 text-center">
                <p className={`text-stone-400 italic mb-3 ${fs.base}`}>{language === 'fr' ? 'Aucun pays répertorié' : 'No country listed'}</p>
                {onEdit && ( <button type="button" onClick={() => { onEdit(); setIsOpen(false); }} className={`px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-900 dark:text-rose-400 rounded-lg font-bold uppercase tracking-widest border border-rose-200 dark:border-rose-900/30 ${fs.label}`}>{t('add_country')}</button> )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
