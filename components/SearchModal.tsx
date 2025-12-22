
import React, { useState } from 'react';
import { X, Search, RotateCcw } from 'lucide-react';
import { SearchFilters, Language } from '../types';
import { COLORS, AGING_POTENTIALS, STRENGTHS, REGIONS_BY_COUNTRY_FR, REGIONS_BY_COUNTRY_EN } from '../constants';
import { getTranslation } from '../translations';
import { CountrySelect } from './CountrySelect';
import { RegionSelect } from './RegionSelect';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: SearchFilters) => void;
  currentFilters: SearchFilters;
  onReset: () => void;
  language: Language;
  isHistoryMode?: boolean;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSearch, currentFilters, onReset, language, isHistoryMode = false }) => {
  const [filters, setFilters] = useState<SearchFilters>(currentFilters);
  const t = (key: any) => getTranslation(language, key);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value === '' ? undefined : (name === 'year' || name === 'recommendedYear' || name === 'strength' ? Number(value) : value)
    }));
  };

  const handleCountryChange = (newCountry: string) => {
    const regionsSource = language === 'fr' ? REGIONS_BY_COUNTRY_FR : REGIONS_BY_COUNTRY_EN;
    const oldCountryRegions = regionsSource[filters.country || ''] || [];
    
    // Si la région actuelle était une région prédéfinie de l'ancien pays, on la vide
    let newRegion = filters.region;
    if (filters.region && oldCountryRegions.includes(filters.region)) {
        newRegion = undefined;
    }

    setFilters(prev => ({ 
      ...prev, 
      country: newCountry || undefined,
      region: newRegion
    }));
  };

  const handleRegionChange = (region: string) => {
    setFilters(prev => ({ ...prev, region: region || undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({});
    onReset();
    onClose();
  };

  const inputClass = "mt-1 block w-full rounded-lg border border-gray-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-gray-900 dark:text-stone-100 shadow-sm focus:border-rose-500 focus:ring-rose-500 h-11 px-3 transition-all";
  const labelClass = "block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-stone-900 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl transition-colors duration-300">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-stone-800">
          <h2 className="text-xl font-serif font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Search size={20} className="text-rose-900 dark:text-rose-500"/>
            {t('search')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-50 dark:bg-stone-800 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          <div>
            <label className={labelClass}>{t('name')}</label>
            <input type="text" name="name" value={filters.name || ''} onChange={handleChange} className={inputClass} placeholder={t('search_placeholder')} />
          </div>

          <div>
            <label className={labelClass}>{t('appellation')}</label>
            <input type="text" name="appellation" value={filters.appellation || ''} onChange={handleChange} className={inputClass} placeholder={t('placeholder_contains')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t('country')}</label>
              <CountrySelect 
                value={filters.country || ''} 
                onChange={handleCountryChange} 
                language={language}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('region')}</label>
              <RegionSelect
                value={filters.region || ''}
                country={filters.country || ''}
                onChange={handleRegionChange}
                language={language}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t('color')}</label>
              <select name="color" value={filters.color || ''} onChange={handleChange} className={inputClass}>
                <option value="">{language === 'fr' ? 'Toutes' : 'All'}</option>
                {COLORS.map(c => <option key={c} value={c}>{t(`color_${c}`)}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('year')}</label>
              <input type="number" name="year" value={filters.year || ''} onChange={handleChange} className={inputClass} placeholder={t('placeholder_vintage')} />
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('origin')}</label>
            <input type="text" name="origin" value={filters.origin || ''} onChange={handleChange} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
             { !isHistoryMode && (
               <div>
                <label className={labelClass}>{t('recommended_year')}</label>
                <input type="number" name="recommendedYear" value={filters.recommendedYear || ''} onChange={handleChange} className={inputClass} placeholder={t('placeholder_drink_in')} />
              </div>
             )}
            <div className={isHistoryMode ? "col-span-2" : ""}>
              <label className={labelClass}>{t('strength')}</label>
              <select name="strength" value={filters.strength !== undefined ? filters.strength : ''} onChange={handleChange} className={inputClass}>
                <option value="">{language === 'fr' ? 'Toutes' : 'All'}</option>
                {STRENGTHS.map(s => <option key={s} value={s}>{s}%</option>)}
              </select>
            </div>
          </div>

          { !isHistoryMode && (
             <div>
              <label className={labelClass}>{t('aging')}</label>
              <select name="agingPotential" value={filters.agingPotential || ''} onChange={handleChange} className={inputClass}>
                <option value="">{language === 'fr' ? 'Toutes' : 'All'}</option>
                {AGING_POTENTIALS.map(a => <option key={a} value={a}>{t(`aging_${a}`)}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-stone-800 flex gap-3 bg-gray-50 dark:bg-stone-900 rounded-b-2xl transition-colors">
          <button onClick={handleReset} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-300 dark:border-stone-700 text-gray-600 dark:text-stone-300 font-medium hover:bg-white dark:hover:bg-stone-800 transition"><RotateCcw size={18} /></button>
          <button onClick={handleSubmit} className="flex-1 bg-rose-900 dark:bg-rose-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-rose-900/20 hover:bg-rose-800 dark:hover:bg-rose-600 transition">{t('search')}</button>
        </div>
      </div>
    </div>
  );
};
