
import React, { useState } from 'react';
import { X, Plus, Globe, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { Language, LocationData } from '../types';
import { getTranslation } from '../translations';

interface LocationManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  locationData: LocationData;
  onUpdateLocationData: (data: LocationData) => void;
}

export const LocationManagerModal: React.FC<LocationManagerModalProps> = ({ 
  isOpen, 
  onClose, 
  language, 
  locationData, 
  onUpdateLocationData 
}) => {
  const t = (key: any) => getTranslation(language, key);
  const [newCountry, setNewCountry] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [newRegion, setNewRegion] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  if (!isOpen) return null;

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleAddCountry = () => {
    const name = newCountry.trim();
    if (!name) return;
    if (locationData.countries.some(c => c.toLowerCase() === name.toLowerCase())) {
      showFeedback('error', t('country_already_exists'));
      return;
    }

    const updated = {
      ...locationData,
      countries: [...locationData.countries, name].sort()
    };
    onUpdateLocationData(updated);
    setNewCountry('');
    showFeedback('success', t('country_added'));
  };

  const handleAddRegion = () => {
    const name = newRegion.trim();
    if (!name || !selectedCountry) return;
    
    const existingRegions = locationData.regions[selectedCountry] || [];
    if (existingRegions.some(r => r.toLowerCase() === name.toLowerCase())) {
      showFeedback('error', t('region_already_exists'));
      return;
    }

    const updated = {
      ...locationData,
      regions: {
        ...locationData.regions,
        [selectedCountry]: [...existingRegions, name].sort()
      }
    };
    onUpdateLocationData(updated);
    setNewRegion('');
    showFeedback('success', t('region_added'));
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-stone-900 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-white dark:bg-stone-800/50">
          <h2 className="font-serif font-bold text-lg text-rose-900 dark:text-rose-100">{t('manage_locations')}</h2>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-full bg-white dark:bg-stone-800 shadow-sm transition-colors"><X size={20}/></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8 no-scrollbar pb-10">
          {feedback && (
            <div className={`p-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 ${feedback.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30'}`}>
              {feedback.type === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
              <span className="text-sm font-bold">{feedback.message}</span>
            </div>
          )}

          {/* Section Pays */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-stone-400 dark:text-stone-500 mb-1">
              <Globe size={16}/>
              <span className="text-xs font-bold uppercase tracking-widest">{t('add_country')}</span>
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value)}
                placeholder={t('new_country_placeholder')}
                className="flex-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-sm shadow-sm focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
              />
              <button 
                onClick={handleAddCountry}
                disabled={!newCountry.trim()}
                className="bg-rose-900 dark:bg-rose-700 text-white p-3 rounded-xl shadow-lg disabled:opacity-50 active:scale-95 transition-all"
              >
                <Plus size={20}/>
              </button>
            </div>
          </div>

          {/* Section Région */}
          <div className="space-y-3 pt-4 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2 text-stone-400 dark:text-stone-500 mb-1">
              <MapPin size={16}/>
              <span className="text-xs font-bold uppercase tracking-widest">{t('add_region')}</span>
            </div>
            <div className="space-y-3">
              <select 
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-sm shadow-sm outline-none transition-all"
              >
                <option value="">{t('select_country_first')}</option>
                {locationData.countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newRegion}
                  disabled={!selectedCountry}
                  onChange={(e) => setNewRegion(e.target.value)}
                  placeholder={t('new_region_placeholder')}
                  className="flex-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-sm shadow-sm focus:ring-rose-500 focus:border-rose-500 outline-none transition-all disabled:opacity-50"
                />
                <button 
                  onClick={handleAddRegion}
                  disabled={!newRegion.trim() || !selectedCountry}
                  className="bg-rose-900 dark:bg-rose-700 text-white p-3 rounded-xl shadow-lg disabled:opacity-50 active:scale-95 transition-all"
                >
                  <Plus size={20}/>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
