
import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, ChevronDown, AlertCircle, Pencil } from 'lucide-react';
import { Language } from '../types';

interface RegionSelectProps {
  value: string;
  country: string;
  regions: string[];
  onChange: (value: string) => void;
  onEdit?: () => void; // Rendu facultatif
  language: Language;
  className?: string;
  placeholder?: string;
}

export const RegionSelect: React.FC<RegionSelectProps> = ({ 
  value, 
  country, 
  regions, 
  onChange, 
  onEdit, 
  language, 
  className, 
  placeholder 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (region: string) => {
    onChange(region);
    setSearchTerm('');
    setIsOpen(false);
  };

  const filteredRegions = regions.filter(r => 
    r.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasCountry = !!country;

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative group">
        <input
          type="text"
          value={value}
          readOnly
          onClick={() => hasCountry && setIsOpen(!isOpen)}
          placeholder={placeholder || (language === 'fr' ? 'Sélectionner...' : 'Select...')}
          className={`${className} cursor-pointer selection:bg-transparent pr-12 ${!hasCountry ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {onEdit && (
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 text-stone-400 hover:text-rose-900 dark:hover:text-rose-400 transition-colors bg-stone-50 dark:bg-stone-900 rounded-md border border-stone-200 dark:border-stone-700"
            >
              <Pencil size={14} />
            </button>
          )}
          <div className="flex items-center gap-1 text-stone-400 pointer-events-none">
            <MapPin size={16} />
            <ChevronDown size={14} />
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[110] mt-1 w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          {!hasCountry ? (
            <div className="p-4 text-center">
              <AlertCircle size={20} className="mx-auto text-amber-500 mb-2" />
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                {language === 'fr' ? "Sélectionnez d'abord un pays" : 'Select a country first'}
              </p>
            </div>
          ) : (
            <>
              <div className="p-2 border-b border-stone-100 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    autoFocus
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={language === 'fr' ? `Chercher en ${country}...` : `Search in ${country}...`}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-sm focus:ring-rose-500 focus:border-rose-500 outline-none"
                  />
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto no-scrollbar">
                {filteredRegions.length > 0 ? (
                  <div className="pb-1">
                    <div className="px-4 py-1.5 text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest bg-stone-50/50 dark:bg-stone-900/30">
                      {country}
                    </div>
                    {filteredRegions.map(region => (
                      <button
                        key={`${country}-${region}`}
                        type="button"
                        onClick={() => handleSelect(region)}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors flex items-center justify-between ${value === region ? 'text-rose-900 dark:text-rose-400 font-bold bg-rose-50/50 dark:bg-rose-900/10' : 'text-stone-700 dark:text-stone-300'}`}
                      >
                        {region}
                        {value === region && <div className="w-1.5 h-1.5 rounded-full bg-rose-900 dark:bg-rose-400"></div>}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <p className="text-xs text-stone-400 italic mb-3">
                      {language === 'fr' ? 'Aucune région répertoriée' : 'No region listed'}
                    </p>
                    {onEdit && (
                      <button 
                        type="button"
                        onClick={() => { onEdit(); setIsOpen(false); }}
                        className="px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-900 dark:text-rose-400 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-rose-200 dark:border-rose-900/30"
                      >
                        {language === 'fr' ? 'Ajouter une région' : 'Add a region'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
