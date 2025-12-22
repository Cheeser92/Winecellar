
import React, { useState, useRef } from 'react';
import { Camera, X, Upload, Wine as WineIcon } from 'lucide-react';
import { Wine, Region, WineColor, AgingPotential, Language } from '../types';
import { REGIONS, COLORS, AGING_POTENTIALS, STRENGTHS } from '../constants';
import { getTranslation } from '../translations';

interface WineFormProps {
  onSave: (wine: Omit<Wine, 'id'>) => void;
  onCancel: () => void;
  initialData?: Partial<Wine>;
  availableLocations: string[];
  language: Language;
  isHistoryMode?: boolean;
}

export const WineForm: React.FC<WineFormProps> = ({ onSave, onCancel, initialData, availableLocations, language, isHistoryMode = false }) => {
  const t = (key: any) => getTranslation(language, key);

  const [formData, setFormData] = useState<Omit<Wine, 'id'>>({
    name: initialData?.name || '',
    appellation: initialData?.appellation || '',
    region: initialData?.region || Region.BORDEAUX,
    country: initialData?.country || 'France',
    color: initialData?.color || WineColor.ROUGE,
    year: initialData?.year || new Date().getFullYear(),
    origin: initialData?.origin || '',
    purchaseDate: initialData?.purchaseDate || new Date().toISOString().split('T')[0],
    purchasePlace: initialData?.purchasePlace || '',
    quantity: initialData?.quantity || 1,
    recommendedYear: initialData?.recommendedYear || new Date().getFullYear() + 5,
    price: initialData?.price || 0,
    strength: initialData?.strength || 100,
    tag: initialData?.tag || '',
    note: initialData?.note || '',
    agingPotential: initialData?.agingPotential || AgingPotential.MOYENNE,
    image: initialData?.image || null,
    location: initialData?.location || availableLocations[0],
  });

  const isEdit = !!initialData;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' || name === 'quantity' || name === 'recommendedYear' || name === 'strength' || name === 'price'
        ? Number(value)
        : value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const inputClass = "mt-1 block w-full rounded-lg border border-gray-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-gray-900 dark:text-white shadow-sm focus:border-rose-500 focus:ring-rose-500 h-11 px-3 transition-all";
  const textareaClass = "mt-1 block w-full rounded-lg border border-gray-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-gray-900 dark:text-white shadow-sm focus:border-rose-500 focus:ring-rose-500 p-3 transition-all";
  const labelClass = "block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 pb-24 p-4 bg-stone-50 dark:bg-black min-h-full transition-colors duration-300">
      <div className="flex justify-between items-center mb-2 bg-white dark:bg-stone-900 p-4 rounded-xl shadow-sm sticky top-0 z-10 transition-colors">
        <h2 className="text-xl font-serif font-bold text-rose-900 dark:text-rose-100">
          {isHistoryMode ? t('personal_note') : (isEdit ? t('edit_bottle') : t('add_bottle'))}
        </h2>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100 dark:bg-stone-800 p-2 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 shadow-sm transition-colors">
        {formData.image ? (
          <div className="relative w-full h-56">
            <img src={formData.image} alt="Preview" className="w-full h-full object-contain rounded-lg shadow-md bg-white dark:bg-stone-800" />
            <button type="button" onClick={() => setFormData(prev => ({ ...prev, image: null }))} className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 transition"><X size={16} /></button>
          </div>
        ) : (
          <div className="text-center w-full" onClick={() => fileInputRef.current?.click()}>
            <div className="mx-auto h-16 w-16 bg-rose-50 dark:bg-rose-900/20 text-rose-300 dark:text-rose-500 rounded-full flex items-center justify-center mb-3"><Camera size={32} /></div>
            <div className="flex flex-col text-sm text-gray-600 dark:text-gray-400">
              <label htmlFor="file-upload" className="cursor-pointer font-medium text-rose-700 dark:text-rose-400 hover:text-rose-600">
                <span>{t('take_photo')}</span>
                <input id="file-upload" name="file-upload" type="file" accept="image/*" capture="environment" className="sr-only" ref={fileInputRef} onChange={handleImageChange} />
              </label>
              <span className="text-xs text-gray-400 mt-1">{t('gallery')}</span>
            </div>
          </div>
        )}
      </div>

      {!isHistoryMode ? (
        <>
          <div className="bg-white dark:bg-stone-900 p-5 rounded-xl shadow-sm space-y-4 transition-colors">
            <h3 className="text-sm font-bold text-rose-900 dark:text-rose-500 uppercase tracking-widest border-b border-gray-100 dark:border-stone-800 pb-2 mb-4">{t('info_main')}</h3>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>{t('name')}</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass} placeholder={t('placeholder_wine_name')} />
              </div>
              <div>
                <label className={labelClass}>{t('appellation')}</label>
                <input required type="text" name="appellation" value={formData.appellation} onChange={handleChange} className={inputClass} placeholder={t('placeholder_appellation')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t('region')}</label>
                <select name="region" value={formData.region} onChange={handleChange} className={inputClass}>
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('country')}</label>
                <input type="text" name="country" value={formData.country} onChange={handleChange} className={inputClass} />
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
                <input required type="number" min="1900" max="2100" name="year" value={formData.year} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 p-5 rounded-xl shadow-sm space-y-4 transition-colors">
            <h3 className="text-sm font-bold text-rose-900 dark:text-rose-500 uppercase tracking-widest border-b border-gray-100 dark:border-stone-800 pb-2 mb-4">{t('info_detail_bottle')}</h3>
            <div>
              <label className={labelClass}>{t('location')}</label>
              <select name="location" value={formData.location} onChange={handleChange} className={inputClass}>
                  {availableLocations.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('origin')}</label>
              <input type="text" name="origin" value={formData.origin} onChange={handleChange} className={inputClass} placeholder={t('placeholder_origin')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t('purchase_date')}</label>
                <input type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('purchase_place')}</label>
                <input type="text" name="purchasePlace" value={formData.purchasePlace} onChange={handleChange} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>{t('quantity')}</label>
                <input required type="number" min="1" name="quantity" value={formData.quantity} onChange={handleChange} className={inputClass} />
              </div>
               <div className="col-span-2">
                <label className={labelClass}>{t('recommended_year')}</label>
                <input required type="number" min="1900" max="2100" name="recommendedYear" value={formData.recommendedYear} onChange={handleChange} className={inputClass} />
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
            <div>
                <label className={labelClass}>{t('tag')}</label>
                <textarea name="tag" value={formData.tag} onChange={handleChange} rows={2} className={textareaClass} placeholder={t('placeholder_tag')} />
            </div>
            <div>
              <label className={labelClass}>{t('note')}</label>
              <textarea name="note" value={formData.note} onChange={handleChange} rows={3} className={textareaClass} />
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-stone-900 p-5 rounded-xl shadow-sm space-y-4 transition-colors">
          <div className="pb-4 border-b border-gray-100 dark:border-stone-800">
             <h3 className="font-bold text-lg text-stone-900 dark:text-white leading-tight">{formData.name}</h3>
             <p className="text-sm text-stone-500 dark:text-stone-400 font-medium">{formData.appellation} - {formData.year}</p>
          </div>
          <div>
            <label className={labelClass}>{t('note')}</label>
            <textarea name="note" value={formData.note} onChange={handleChange} rows={8} className={textareaClass} autoFocus placeholder={t('placeholder_note')}/>
          </div>
          <div>
            <label className={labelClass}>{t('tag')}</label>
            <textarea name="tag" value={formData.tag} onChange={handleChange} rows={2} className={textareaClass} placeholder={t('placeholder_tag')} />
          </div>
        </div>
      )}

      <button type="submit" className="w-full sticky bottom-4 bg-rose-900 dark:bg-rose-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:bg-rose-800 dark:hover:bg-rose-600 active:scale-95 transition-all duration-200">{t('save')}</button>
    </form>
  );
};
