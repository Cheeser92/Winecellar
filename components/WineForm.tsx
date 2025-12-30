
import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Minus, Plus, Calendar as CalendarIcon, Pencil, Loader2, AlertCircle, Tag as TagIcon, ChevronDown } from 'lucide-react';
import { Wine, WineColor, AgingPotential, Language, LocationData, AppFontSize, HistoryEntry } from '../types';
import { COLORS, AGING_POTENTIALS, STRENGTHS, RATINGS } from '../constants';
import { getTranslation } from '../translations';
import { CountrySelect } from './CountrySelect';
import { RegionSelect } from './RegionSelect';
import { SuggestionInput } from './SuggestionInput';
import { GoogleGenAI, Type } from "@google/genai";

interface WineFormProps {
  onSave: (wine: Omit<Wine, 'id'>) => void;
  onCancel: () => void;
  initialData?: Partial<Wine> | Partial<HistoryEntry>;
  availableLocations: string[];
  locationData: LocationData;
  globalTags?: string[];
  onOpenLocationManager: () => void;
  onOpenTagManager: () => void;
  language: Language;
  isHistoryMode?: boolean;
  fontSize?: AppFontSize;
  suggestions?: {
    appellations: string[];
    origins: string[];
    purchasePlaces: string[];
  };
}

export const WineForm: React.FC<WineFormProps> = ({ 
  onSave, 
  onCancel, 
  initialData, 
  availableLocations, 
  locationData,
  globalTags = [],
  onOpenLocationManager,
  onOpenTagManager,
  language, 
  isHistoryMode = false,
  fontSize = 'medium',
  suggestions = { appellations: [], origins: [], purchasePlaces: [] }
}) => {
  const t = (key: any) => getTranslation(language, key);

  const formatToDisplay = (isoDate: string) => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  };

  const [formData, setFormData] = useState<any>({
    name: initialData?.name || '',
    appellation: initialData?.appellation || '',
    region: initialData?.region || '',
    country: initialData?.country || (language === 'fr' ? 'France' : 'France'),
    color: initialData?.color || WineColor.ROUGE,
    year: initialData?.year || new Date().getFullYear(),
    origin: initialData?.origin || '',
    purchaseDate: initialData?.purchaseDate || new Date().toISOString().split('T')[0],
    purchasePlace: initialData?.purchasePlace || '',
    quantity: initialData?.quantity || 1,
    recommendedYear: initialData?.recommendedYear || new Date().getFullYear() + 5,
    price: initialData?.price && initialData?.price !== 0 ? String(initialData.price) : '',
    strength: initialData?.strength || 100,
    tag: initialData?.tag || '',
    note: initialData?.note || '',
    agingPotential: initialData?.agingPotential || AgingPotential.MOYENNE,
    image: initialData?.image || null,
    location: initialData?.location || availableLocations[0],
    consumptionRating: (initialData as HistoryEntry)?.consumptionRating || 5,
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  
  const isEdit = !!initialData;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const tagContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHistoryMode) return;
    const diff = formData.recommendedYear - formData.year;
    let newPotential = AgingPotential.MOYENNE;
    if (diff <= 4) newPotential = AgingPotential.COURTE;
    else if (diff > 8) newPotential = AgingPotential.LONGUE;
    if (newPotential !== formData.agingPotential) {
      setFormData(prev => ({ ...prev, agingPotential: newPotential }));
    }
  }, [formData.year, formData.recommendedYear, isHistoryMode]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tagContainerRef.current && !tagContainerRef.current.contains(event.target as Node)) {
        setIsTagDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setValidationError(null);

    if (name === 'price') {
      setFormData(prev => ({ ...prev, [name]: value }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' || name === 'quantity' || name === 'recommendedYear' || name === 'strength' || name === 'consumptionRating'
        ? Number(value)
        : value
    }));
  };

  const handleSuggestionChange = (name: string, value: string) => {
    setValidationError(null);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const analyzeLabel = async (base64Data: string) => {
    if (isEdit) return;

    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Content = base64Data.split(',')[1];
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{
          parts: [
            { text: "Extract the wine name (domain and cuvée) and the vintage year from this bottle label. Return only JSON format with 'name' and 'year' keys. If the year is not found, use the current year." },
            { inlineData: { mimeType: 'image/jpeg', data: base64Content } }
          ]
        }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              year: { type: Type.INTEGER }
            },
            required: ["name", "year"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      
      setFormData(prev => ({
        ...prev,
        name: prev.name || result.name || '',
        year: (!prev.name || prev.year === new Date().getFullYear()) ? (result.year || prev.year) : prev.year
      }));
    } catch (error) {
      console.error("AI Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuantityChange = (newQty: number) => {
    setValidationError(null);
    setFormData(prev => ({ ...prev, quantity: Math.max(1, newQty) }));
  };

  const handleCountryChange = (newCountry: string) => {
    setValidationError(null);
    const newRegions = locationData.regions[newCountry] || [];
    let newRegion = formData.region;
    if (!newRegions.includes(formData.region)) newRegion = '';
    setFormData(prev => ({ ...prev, country: newCountry, region: newRegion }));
  };

  const handleRegionChange = (region: string) => {
    setValidationError(null);
    setFormData(prev => ({ ...prev, region }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFormData(prev => ({ ...prev, image: base64 }));
        analyzeLabel(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectTag = (selectedTag: string) => {
    const currentTags = formData.tag ? formData.tag.split(',').map((t: string) => t.trim()) : [];
    if (!currentTags.includes(selectedTag)) {
      const newTagString = [...currentTags, selectedTag].join(', ');
      setFormData(prev => ({ ...prev, tag: newTagString }));
    }
    setIsTagDropdownOpen(false);
    setTagSearchTerm('');
  };

  // Fixed typo: changed HTMLInputChangeEvent to HTMLInputElement
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, tag: value }));
    
    // Extraire le dernier mot pour la recherche si nécessaire
    const parts = value.split(',');
    const lastPart = parts[parts.length - 1].trim();
    setTagSearchTerm(lastPart);
  };

  const handleSubmit = (e: React.FormEvent) => { 
    e.preventDefault(); 
    
    if (!isHistoryMode) {
      if (formData.recommendedYear <= formData.year) {
        setValidationError(t('error_recommended_year'));
        return;
      }

      const purchaseYear = new Date(formData.purchaseDate).getFullYear();
      if (purchaseYear < formData.year) {
        setValidationError(t('error_purchase_year'));
        return;
      }
    }

    const finalData = {
      ...formData,
      price: parseFloat(formData.price.replace(',', '.')) || 0
    };
    onSave(finalData); 
  };

  const getFontSizeClasses = (size: AppFontSize) => {
    switch(size) {
      case 'small': return { base: 'text-xs', label: 'text-[9px]', lg: 'text-sm', xl: 'text-base' };
      case 'large': return { base: 'text-base', label: 'text-[11px]', lg: 'text-lg', xl: 'text-xl' };
      case 'medium':
      default: return { base: 'text-sm', label: 'text-[10px]', xl: 'text-lg', lg: 'text-base' };
    }
  };

  const fs = getFontSizeClasses(fontSize as AppFontSize);
  const inputClass = `mt-1 block w-full rounded-lg border border-gray-300 dark:border-stone-700 bg-[var(--theme-bg-soft)] dark:bg-stone-800 text-gray-900 dark:text-white shadow-sm focus:border-[var(--theme-primary)] focus:ring-[var(--theme-primary)]/20 h-11 px-3 transition-all ${fs.base}`;
  const requiredInputClass = `mt-1 block w-full rounded-lg border-2 border-[var(--theme-primary)] bg-[var(--theme-bg-soft)] dark:bg-stone-800 text-gray-900 dark:text-white shadow-sm focus:border-[var(--theme-primary)] focus:ring-[var(--theme-primary)]/20 h-11 px-3 transition-all ${fs.base}`;
  const textareaClass = `mt-1 block w-full rounded-lg border border-gray-300 dark:border-stone-700 bg-[var(--theme-bg-soft)] dark:bg-stone-800 text-gray-900 dark:text-white shadow-sm focus:border-[var(--theme-primary)] focus:ring-[var(--theme-primary)]/20 p-3 transition-all ${fs.base}`;
  const labelClass = `block font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 ${fs.label}`;

  const filteredTags = globalTags.filter(gt => {
    if (!tagSearchTerm) return true;
    return gt.toLowerCase().includes(tagSearchTerm.toLowerCase());
  });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 pb-24 p-4 bg-stone-100 dark:bg-black min-h-full transition-colors duration-300 relative">
      <div className="flex justify-between items-center mb-2 bg-white dark:bg-stone-900 p-4 rounded-xl shadow-sm sticky top-0 z-10 transition-colors border-b border-[var(--theme-bg-soft)]">
        <h2 className={`font-serif font-bold text-[var(--theme-primary-dark)] dark:text-stone-100 ${fs.xl}`}>
          {isHistoryMode ? t('edit_bottle') : (isEdit ? t('edit_bottle') : t('add_bottle'))}
        </h2>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100 dark:bg-stone-800 p-2 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <div 
        onClick={() => fileInputRef.current?.click()}
        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 shadow-sm transition-colors cursor-pointer active:bg-gray-50 dark:active:bg-stone-800 relative overflow-hidden group"
      >
        {formData.image ? (
          <div className="relative w-full h-56">
            <img src={formData.image} alt="Preview" className="w-full h-full object-contain rounded-lg shadow-md bg-white dark:bg-stone-800" />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <Pencil size={24} className="text-white" />
            </div>
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white backdrop-blur-sm transition-all rounded-lg">
                <Loader2 size={32} className="animate-spin mb-2" />
                <span className="font-bold text-sm uppercase tracking-widest">{t('analyzing_label')}</span>
              </div>
            )}
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, image: null })); }} 
              className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 transition z-10"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="text-center w-full">
            <div className="mx-auto h-16 w-16 bg-[var(--theme-bg-soft)] dark:bg-rose-900/20 text-[var(--theme-primary)] dark:text-rose-500 rounded-full flex items-center justify-center mb-3">
              <Camera size={32} />
            </div>
            <div className="flex flex-col text-sm text-gray-600 dark:text-gray-400">
              <span className={`font-medium text-[var(--theme-primary)] dark:text-rose-400 ${fs.base}`}>
                {t('take_photo')}
              </span>
              <span className={`text-gray-400 mt-1 ${fs.label}`}>{t('gallery')}</span>
            </div>
          </div>
        )}
        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
      </div>

      {!isHistoryMode ? (
        <>
          <div className="bg-white dark:bg-stone-900 p-5 rounded-xl shadow-sm space-y-4 transition-colors">
            <h3 className={`font-bold text-[var(--theme-primary)] dark:text-rose-500 uppercase tracking-widest border-b border-gray-100 dark:border-stone-800 pb-2 mb-4 ${fs.base}`}>{t('info_main')}</h3>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>{t('name')}</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} className={requiredInputClass} placeholder={t('placeholder_wine_name')} />
              </div>
              <div>
                <label className={labelClass}>{t('appellation')}</label>
                <SuggestionInput
                  value={formData.appellation}
                  onChange={(val) => handleSuggestionChange('appellation', val)}
                  suggestions={suggestions.appellations}
                  placeholder={t('placeholder_appellation')}
                  required
                  className={requiredInputClass}
                  fontSize={fontSize}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t('country')}</label>
                <CountrySelect 
                  value={formData.country} 
                  countries={locationData.countries}
                  onChange={handleCountryChange} 
                  onEdit={onOpenLocationManager}
                  language={language}
                  className={inputClass}
                  fontSize={fontSize as AppFontSize}
                />
              </div>
              <div>
                <label className={labelClass}>{t('region')}</label>
                <RegionSelect
                  value={formData.region}
                  country={formData.country}
                  regions={locationData.regions[formData.country] || []}
                  onChange={handleRegionChange}
                  onEdit={onOpenLocationManager}
                  language={language}
                  className={inputClass}
                  fontSize={fontSize as AppFontSize}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t('color')}</label>
                <select name="color" value={formData.color} onChange={handleChange} className={inputClass}>
                  {COLORS.map(c => <option key={c} value={c}>{t(`color_${c}`)}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('year')}</label>
                <input required type="number" min="1900" max="2100" name="year" value={formData.year} onChange={handleChange} className={requiredInputClass} placeholder={t('placeholder_vintage')} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 p-5 rounded-xl shadow-sm space-y-4 transition-colors">
            <h3 className={`font-bold text-[var(--theme-primary)] dark:text-rose-500 uppercase tracking-widest border-b border-gray-100 dark:border-stone-800 pb-2 mb-4 ${fs.base}`}>{t('info_detail_bottle')}</h3>
            <div>
              <label className={labelClass}>{t('location')}</label>
              <select name="location" value={formData.location} onChange={handleChange} className={inputClass}>
                  {availableLocations.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('origin')}</label>
              <SuggestionInput
                value={formData.origin}
                onChange={(val) => handleSuggestionChange('origin', val)}
                suggestions={suggestions.origins}
                placeholder={t('placeholder_origin')}
                className={inputClass}
                fontSize={fontSize}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t('purchase_date')}</label>
                <div className="relative">
                  <input type="text" readOnly value={formatToDisplay(formData.purchaseDate)} className={`${inputClass} cursor-pointer`} />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
                    <CalendarIcon size={18} />
                  </div>
                  <input type="date" name="purchaseDate" ref={dateInputRef} value={formData.purchaseDate} onChange={handleChange} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                </div>
              </div>
              <div>
                <label className={labelClass}>{t('purchase_place')}</label>
                <SuggestionInput
                  value={formData.purchasePlace}
                  onChange={(val) => handleSuggestionChange('purchasePlace', val)}
                  suggestions={suggestions.purchasePlaces}
                  className={inputClass}
                  fontSize={fontSize}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t('quantity')}</label>
                <div className="flex items-center gap-2 mt-1">
                  <button type="button" onClick={() => handleQuantityChange(formData.quantity - 1)} className="w-11 h-11 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center border border-stone-200 dark:border-stone-700 active:scale-90 transition-all">
                    <Minus size={18} className="text-stone-600 dark:text-stone-300" />
                  </button>
                  <div className={`flex-1 h-11 bg-[var(--theme-bg-soft)] dark:bg-stone-800 border-2 border-[var(--theme-border)] rounded-lg flex items-center justify-center font-bold text-gray-900 dark:text-white ${fs.lg}`}>{formData.quantity}</div>
                  <button type="button" onClick={() => handleQuantityChange(formData.quantity + 1)} className="w-11 h-11 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center border border-stone-200 dark:border-stone-700 active:scale-90 transition-all">
                    <Plus size={18} className="text-stone-600 dark:text-stone-300" />
                  </button>
                </div>
              </div>
               <div>
                <label className={labelClass}>{t('recommended_year')}</label>
                <input required type="number" min="1900" max="2100" name="recommendedYear" value={formData.recommendedYear} onChange={handleChange} className={requiredInputClass} placeholder={t('placeholder_drink_in')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className={labelClass}>{t('price')}</label>
                <input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('strength')}</label>
                <select name="strength" value={formData.strength} onChange={handleChange} className={inputClass}>
                  {STRENGTHS.map(s => <option key={s} value={s}>{s}%</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className={labelClass}>{t('aging')}</label>
                <select name="agingPotential" value={formData.agingPotential} onChange={handleChange} className={inputClass}>
                  {AGING_POTENTIALS.map(a => <option key={a} value={a}>{t(`aging_${a}`)}</option>)}
                </select>
              </div>
            </div>
            
            {/* Champ Tag amélioré */}
            <div className="relative" ref={tagContainerRef}>
              <label className={labelClass}>{t('tag')}</label>
              <div className="relative group">
                <input 
                  type="text" 
                  name="tag" 
                  value={formData.tag} 
                  onChange={handleTagInputChange}
                  onFocus={() => setIsTagDropdownOpen(true)}
                  className={`${inputClass} pr-20`} 
                  placeholder={t('placeholder_tag')} 
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <button type="button" onClick={onOpenTagManager} className="p-1.5 text-stone-400 hover:text-[var(--theme-primary)] dark:hover:text-rose-400 transition-colors bg-stone-50 dark:bg-stone-900 rounded-md border border-stone-200 dark:border-stone-700">
                    <Pencil size={14} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                    className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
                  >
                    <ChevronDown size={18} />
                  </button>
                </div>
              </div>
              {isTagDropdownOpen && filteredTags.length > 0 && (
                <div className="absolute z-[120] mt-1 w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="max-h-48 overflow-y-auto no-scrollbar">
                    {filteredTags.map((tag, idx) => (
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

            <div>
              <label className={labelClass}>{t('note')}</label>
              <textarea name="note" value={formData.note} onChange={handleChange} rows={3} className={textareaClass} placeholder={t('placeholder_note')} />
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-stone-900 p-5 rounded-xl shadow-sm space-y-5 transition-colors">
          <div className="pb-4 border-b border-gray-100 dark:border-stone-800">
             <h3 className={`font-bold text-stone-900 dark:text-white leading-tight ${fs.lg}`}>{formData.name}</h3>
             <p className={`text-stone-500 dark:text-stone-400 font-medium ${fs.base}`}>{formData.appellation} - {formData.year}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Note (1-5)</label>
              <div className="flex gap-1.5 justify-between mt-1">
                {RATINGS.map(r => (
                  <button 
                    key={r} 
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, consumptionRating: r }))}
                    className={`flex-1 h-10 rounded-lg font-bold transition-all border ${formData.consumptionRating === r ? 'bg-[var(--theme-primary)] text-white border-[var(--theme-primary)]' : 'bg-stone-50 dark:bg-stone-800 text-stone-400 border-stone-200 dark:border-stone-700'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>{t('strength')}</label>
              <select name="strength" value={formData.strength} onChange={handleChange} className={inputClass}>
                {STRENGTHS.map(s => <option key={s} value={s}>{s}%</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('personal_note')}</label>
            <textarea name="note" value={formData.note} onChange={handleChange} rows={6} className={textareaClass} placeholder={t('placeholder_note')}/>
          </div>
          
          {/* Tag en mode historique */}
          <div className="relative" ref={tagContainerRef}>
              <label className={labelClass}>{t('tag')}</label>
              <div className="relative group">
                <input 
                  type="text" 
                  name="tag" 
                  value={formData.tag} 
                  onChange={handleTagInputChange}
                  onFocus={() => setIsTagDropdownOpen(true)}
                  className={`${inputClass} pr-20`} 
                  placeholder={t('placeholder_tag')} 
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <button type="button" onClick={onOpenTagManager} className="p-1.5 text-stone-400 hover:text-[var(--theme-primary)] dark:hover:text-rose-400 transition-colors bg-stone-50 dark:bg-stone-900 rounded-md border border-stone-200 dark:border-stone-700">
                    <Pencil size={14} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                    className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
                  >
                    <ChevronDown size={18} />
                  </button>
                </div>
              </div>
              {isTagDropdownOpen && filteredTags.length > 0 && (
                <div className="absolute z-[120] mt-1 w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="max-h-48 overflow-y-auto no-scrollbar">
                    {filteredTags.map((tag, idx) => (
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
      )}

      {validationError && (
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-900/30 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex flex-col">
            <span className="font-bold text-red-900 dark:text-red-400 text-sm uppercase tracking-wide mb-1">{t('error_validation')}</span>
            <span className={`text-red-700 dark:text-red-300 leading-tight ${fs.base}`}>{validationError}</span>
          </div>
        </div>
      )}

      <button type="submit" className={`w-full sticky bottom-4 bg-[var(--theme-primary)] text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:bg-[var(--theme-primary-dark)] active:scale-95 transition-all duration-200 ${fs.lg}`}>{t('save')}</button>
    </form>
  );
};
