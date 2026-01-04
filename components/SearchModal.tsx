
import React, { useState, useEffect } from 'react';
import { X, Search, RotateCcw, Eraser, Tag as TagIcon, LayoutGrid, Globe, ChevronDown } from 'lucide-react';
import { SearchFilters, Language, LocationData, AppFontSize, WineColor, AgingPotential } from '../types';
import { COLORS, AGING_POTENTIALS, STRENGTHS, RATINGS } from '../constants';
import { getTranslation } from '../translations';
import { CountrySelect } from './CountrySelect';
import { RegionSelect } from './RegionSelect';
import { SuggestionInput } from './SuggestionInput';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: SearchFilters) => void;
  currentFilters: SearchFilters;
  onReset: () => void;
  locationData: LocationData;
  globalTags?: string[];
  language: Language;
  isHistoryMode?: boolean;
  fontSize?: AppFontSize;
  suggestions?: {
    appellations: string[];
    origins: string[];
    purchasePlaces: string[];
  };
}

export const SearchModal: React.FC<SearchModalProps> = ({ 
  isOpen, 
  onClose, 
  onSearch, 
  currentFilters, 
  onReset, 
  locationData,
  globalTags = [],
  language, 
  isHistoryMode = false,
  fontSize = 'medium',
  suggestions = { appellations: [], origins: [], purchasePlaces: [] }
}) => {
  const [filters, setFilters] = useState<SearchFilters>(currentFilters);
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  
  const t = (key: any) => getTranslation(language, key);

  useEffect(() => {
    if (isOpen) {
      setFilters(currentFilters);
    }
  }, [isOpen, currentFilters]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value === '' ? undefined : (name === 'year' || name === 'recommendedYear' || name === 'strength' || name === 'consumptionRating' ? Number(value) : value)
    }));
  };

  const handleSuggestionChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value === '' ? undefined : value }));
  };

  const toggleScope = (scope: 'current' | 'all') => {
    setFilters(prev => ({ ...prev, searchScope: scope }));
  };

  const resetField = (name: keyof SearchFilters) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[name];
      return newFilters;
    });
  };

  const handleCountryChange = (newCountry: string) => {
    if (!newCountry) { resetField('country'); resetField('region'); return; }
    const countryRegions = locationData.regions[newCountry] || [];
    let newRegion = filters.region;
    if (filters.region && !countryRegions.includes(filters.region)) newRegion = undefined;
    setFilters(prev => ({ ...prev, country: newCountry, region: newRegion }));
  };

  const handleRegionChange = (region: string) => {
    if (!region) { resetField('region'); return; }
    setFilters(prev => ({ ...prev, region: region }));
  };

  // Gestion spécifique de la multi-sélection des tags
  const selectedTags = filters.tag ? filters.tag.split(',').map(t => t.trim()).filter(t => t !== '') : [];

  const handleSelectTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      const newTags = [...selectedTags, tag].join(', ');
      setFilters(prev => ({ ...prev, tag: newTags }));
    }
    setTagSearchTerm('');
    setIsTagDropdownOpen(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter(t => t !== tagToRemove).join(', ');
    setFilters(prev => ({ ...prev, tag: newTags === '' ? undefined : newTags }));
  };

  const filteredGlobalTags = globalTags.filter(gt => 
    gt.toLowerCase().includes(tagSearchTerm.toLowerCase()) && !selectedTags.includes(gt)
  );

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSearch(filters); onClose(); };
  const handleReset = () => { onReset(); onClose(); };

  const getFontSizeClasses = (size: AppFontSize) => {
    switch(size) {
      case 'small': return { base: 'text-xs', label: 'text-[9px]', xl: 'text-base' };
      case 'large': return { base: 'text-base', label: 'text-[11px]', xl: 'text-xl' };
      case 'medium':
      default: return { base: 'text-sm', label: 'text-[10px]', xl: 'text-lg' };
    }
  };

  const fs = getFontSizeClasses(fontSize as AppFontSize);
  
  const inputClass = `mt-1 block w-full rounded-lg border-2 border-[var(--theme-border)] bg-[var(--theme-bg-soft)] dark:bg-stone-800 text-gray-900 dark:text-stone-100 shadow-sm focus:border-[var(--theme-primary)] focus:ring-[var(--theme-primary)]/20 h-11 transition-all outline-none ${fs.base}`;
  const labelClass = `block font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 ${fs.label}`;

  const ClearButton = ({ onClick, visible }: { onClick: () => void, visible: boolean }) => {
    if (!visible) return null;
    return (
      <button type="button" onClick={onClick} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-stone-500 hover:text-[var(--theme-primary)] dark:text-stone-400 dark:hover:text-rose-400 transition-colors z-20"><Eraser size={16} /></button>
    );
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-stone-900 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl transition-colors duration-300 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-stone-800 bg-white dark:bg-stone-800">
          <div className="flex flex-col">
            <h2 className={`font-serif font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 ${fs.xl}`}>
              <Search size={20} className="text-[var(--theme-primary)] dark:text-rose-500"/>
              {t('search')}
            </h2>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">
              {isHistoryMode ? t('history') : t('cellar')}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-50 dark:bg-stone-800 p-2 rounded-full transition-colors"><X size={20} /></button>
        </div>
        
        <div className="overflow-y-auto p-5 space-y-4 no-scrollbar">
          {!isHistoryMode && (
            <div className="space-y-2">
              <label className={labelClass}>{t('search_scope')}</label>
              <div className="flex p-1 bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">
                <button 
                  type="button" 
                  onClick={() => toggleScope('current')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold transition-all ${filters.searchScope === 'current' ? 'bg-white dark:bg-stone-700 shadow-sm text-[var(--theme-primary)] dark:text-white' : 'text-stone-400 hover:text-stone-600'}`}
                >
                  <LayoutGrid size={16} />
                  <span className={fs.base}>{t('search_this_cellar')}</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => toggleScope('all')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold transition-all ${filters.searchScope === 'all' ? 'bg-white dark:bg-stone-700 shadow-sm text-[var(--theme-primary)] dark:text-white' : 'text-stone-400 hover:text-stone-600'}`}
                >
                  <Globe size={16} />
                  <span className={fs.base}>{t('search_all_cellars')}</span>
                </button>
              </div>
            </div>
          )}

          <div><label className={labelClass}>{t('name')}</label><div className="relative"><input type="text" name="name" value={filters.name || ''} onChange={handleChange} className={`${inputClass} pl-3 pr-10`} placeholder={t('search_placeholder')} /><ClearButton onClick={() => resetField('name')} visible={!!filters.name} /></div></div>
          
          <div>
            <label className={labelClass}>{t('appellation')}</label>
            <SuggestionInput
              value={filters.appellation || ''}
              onChange={(val) => handleSuggestionChange('appellation', val)}
              suggestions={suggestions.appellations}
              placeholder={t('placeholder_contains')}
              className={`${inputClass} pl-3 pr-10`}
              fontSize={fontSize}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>{t('country')}</label><CountrySelect value={filters.country || ''} countries={locationData.countries} onChange={handleCountryChange} onClear={() => handleCountryChange('')} language={language} className={`${inputClass} pl-3 pr-10`} fontSize={fontSize as AppFontSize} /></div>
            <div><label className={labelClass}>{t('region')}</label><RegionSelect value={filters.region || ''} country={filters.country || ''} regions={filters.country ? (locationData.regions[filters.country] || []) : []} onChange={handleRegionChange} onClear={() => handleRegionChange('')} language={language} className={`${inputClass} pl-3 pr-10`} fontSize={fontSize as AppFontSize} /></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>{t('color')}</label><div className="relative"><select name="color" value={filters.color || ''} onChange={handleChange} className={`${inputClass} pl-3 pr-10`}><option value="">{t('all')}</option>{COLORS.map(c => <option key={c} value={c}>{t(`color_${c}`)}</option>)}</select><ClearButton onClick={() => resetField('color')} visible={!!filters.color} /></div></div>
            <div><label className={labelClass}>{t('year')}</label><div className="relative"><input type="number" name="year" value={filters.year || ''} onChange={handleChange} className={`${inputClass} pl-3 pr-10`} placeholder={t('placeholder_vintage')} /><ClearButton onClick={() => resetField('year')} visible={filters.year !== undefined} /></div></div>
          </div>

          <div>
            <label className={labelClass}>{t('origin')}</label>
            <SuggestionInput
              value={filters.origin || ''}
              onChange={(val) => handleSuggestionChange('origin', val)}
              suggestions={suggestions.origins}
              placeholder={t('placeholder_contains')}
              className={`${inputClass} pl-3 pr-10`}
              fontSize={fontSize}
            />
          </div>

          <div>
            <label className={labelClass}>{t('purchase_place')}</label>
            <SuggestionInput
              value={filters.purchasePlace || ''}
              onChange={(val) => handleSuggestionChange('purchasePlace', val)}
              suggestions={suggestions.purchasePlaces}
              placeholder={t('placeholder_contains')}
              className={`${inputClass} pl-3 pr-10`}
              fontSize={fontSize}
            />
          </div>
          
          {/* Tag avec multi-sélection */}
          <div className="relative">
            <label className={labelClass}>{t('tag')}</label>
            <div className="space-y-2">
              <div className="relative">
                <input 
                  type="text" 
                  value={tagSearchTerm} 
                  onChange={(e) => { setTagSearchTerm(e.target.value); setIsTagDropdownOpen(true); }}
                  onFocus={() => setIsTagDropdownOpen(true)}
                  className={`${inputClass} pr-10`} 
                  placeholder={t('placeholder_contains')} 
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-stone-400">
                  <button type="button" onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)} className="hover:text-stone-600 transition-colors">
                    <ChevronDown size={18} className={`transition-transform ${isTagDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Badges des tags sélectionnés */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedTags.map(tag => (
                    <div key={tag} className="flex items-center gap-1.5 bg-[var(--theme-bg-soft)] dark:bg-rose-900/30 text-[var(--theme-primary)] dark:text-rose-400 px-2.5 py-1 rounded-lg border border-[var(--theme-border)] dark:border-rose-900/50 shadow-sm animate-in zoom-in-90 duration-150">
                      <span className={`font-bold ${fs.base}`}>{tag}</span>
                      <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-rose-700 dark:hover:text-rose-200 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Dropdown des suggestions de tags */}
              {isTagDropdownOpen && filteredGlobalTags.length > 0 && (
                <div className="absolute z-[130] mt-1 w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="max-h-48 overflow-y-auto no-scrollbar">
                    {filteredGlobalTags.map((tag, idx) => (
                      <button 
                        key={idx} 
                        type="button" 
                        onClick={() => handleSelectTag(tag)}
                        className={`w-full text-left px-4 py-3 hover:bg-[var(--theme-bg-soft)] dark:hover:bg-rose-900/20 transition-colors flex items-center justify-between ${fs.base} text-stone-700 dark:text-stone-300 border-b border-stone-50 dark:border-stone-700 last:border-0`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             { !isHistoryMode ? (
                <>
                  <div><label className={labelClass}>{t('recommended_year')}</label><div className="relative"><input type="number" name="recommendedYear" value={filters.recommendedYear || ''} onChange={handleChange} className={`${inputClass} pl-3 pr-10`} placeholder={t('placeholder_drink_in')} /><ClearButton onClick={() => resetField('recommendedYear')} visible={filters.recommendedYear !== undefined} /></div></div>
                  <div>
                    <label className={labelClass}>{t('aging')}</label>
                    <div className="relative"><select name="agingPotential" value={filters.agingPotential || ''} onChange={handleChange} className={`${inputClass} pl-3 pr-10`}><option value="">{t('all')}</option>{AGING_POTENTIALS.map(a => <option key={a} value={a}>{t(`aging_${a}`)}</option>)}</select><ClearButton onClick={() => resetField('agingPotential')} visible={!!filters.agingPotential} /></div>
                  </div>
                </>
             ) : (
                <>
                  <div>
                    <label className={labelClass}>Note</label>
                    <div className="relative">
                      <select name="consumptionRating" value={filters.consumptionRating || ''} onChange={handleChange} className={`${inputClass} pl-3 pr-10`}>
                        <option value="">{t('all')}</option>
                        {RATINGS.map(r => <option key={r} value={r}>{r} {r === 1 ? 'étoile' : 'étoiles'}</option>)}
                      </select>
                      <ClearButton onClick={() => resetField('consumptionRating')} visible={!!filters.consumptionRating} />
                    </div>
                  </div>
                </>
             )}
          </div>

          <div>
              <label className={labelClass}>{t('strength')}</label>
              <div className="relative"><select name="strength" value={filters.strength !== undefined ? filters.strength : ''} onChange={handleChange} className={`${inputClass} pl-3 pr-10`}><option value="">{t('all')}</option>{STRENGTHS.map(s => <option key={s} value={s}>{s}%</option>)}</select><ClearButton onClick={() => resetField('strength')} visible={filters.strength !== undefined} /></div>
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-100 dark:border-stone-800 flex gap-3 bg-white dark:bg-stone-900 flex-shrink-0">
          <button onClick={handleReset} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-300 dark:border-stone-700 text-gray-600 dark:text-stone-300 font-medium hover:bg-white dark:hover:bg-stone-800 transition" title={t('reset')}><RotateCcw size={18} /></button>
          <button onClick={handleSubmit} className={`flex-1 bg-[var(--theme-primary)] dark:bg-[var(--theme-primary-dark)] text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:opacity-90 transition ${fs.base}`}>{t('search')}</button>
        </div>
      </div>
    </div>
  );
};