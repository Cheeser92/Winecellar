
import React, { useState, useRef, useEffect } from 'react';
import { Search, Globe, ChevronDown } from 'lucide-react';
import { COUNTRIES_FR, COUNTRIES_EN } from '../constants';
import { Language } from '../types';

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  language: Language;
  className?: string;
  placeholder?: string;
}

export const CountrySelect: React.FC<CountrySelectProps> = ({ value, onChange, language, className, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sélection de la liste source selon la langue
  const countryList = language === 'fr' ? COUNTRIES_FR : COUNTRIES_EN;

  const filteredCountries = countryList.filter(c => 
    c.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (country: string) => {
    onChange(country);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder || (language === 'fr' ? 'Saisir un pays...' : 'Enter country...')}
          className={className}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-stone-400 pointer-events-none">
          <Globe size={16} />
          <ChevronDown size={14} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[100] mt-1 w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="p-2 border-b border-stone-100 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
              <input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'fr' ? 'Rechercher...' : 'Search...'}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-sm focus:ring-rose-500 focus:border-rose-500 outline-none"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto no-scrollbar">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  key={country}
                  type="button"
                  onClick={() => handleSelect(country)}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors flex items-center justify-between ${value === country ? 'text-rose-900 dark:text-rose-400 font-bold bg-rose-50/50 dark:bg-rose-900/10' : 'text-stone-700 dark:text-stone-300'}`}
                >
                  {country}
                  {value === country && <div className="w-1.5 h-1.5 rounded-full bg-rose-900 dark:bg-rose-400"></div>}
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-xs text-stone-400 italic mb-1">
                  {language === 'fr' ? 'Aucun pays trouvé' : 'No country found'}
                </p>
                <p className="text-[10px] text-stone-500 uppercase tracking-tight">
                  {language === 'fr' ? 'Saisie manuelle possible' : 'Manual entry allowed'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
