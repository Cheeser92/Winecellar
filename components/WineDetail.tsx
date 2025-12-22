
import React, { useState, useRef } from 'react';
import { ArrowLeft, Check, Calendar, Clock, Tag, Trash2, Star, Pencil, Copy, Camera, ShoppingBag } from 'lucide-react';
import { Wine, ConsumptionStatus, HistoryEntry, Language, AppFontSize } from '../types';
import { RATINGS, STRENGTHS } from '../constants';
import { getTranslation } from '../translations';

interface WineDetailProps {
  wine: Wine | HistoryEntry;
  onBack: () => void;
  onConsume?: (wine: Wine, rating: number, strength: number) => void;
  onDelete: (id: string) => void;
  onEdit?: () => void;
  onDuplicate?: (wine: Wine, quantity: number, location: string) => void;
  onUpdateImage?: (image: string) => void;
  availableLocations: string[];
  isHistory?: boolean;
  language: Language;
  fontSize?: AppFontSize;
}

export const WineDetail: React.FC<WineDetailProps> = ({ wine, onBack, onConsume, onDelete, onEdit, onDuplicate, onUpdateImage, availableLocations, isHistory = false, language, fontSize = 'medium' }) => {
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  
  const [rating, setRating] = useState<number>(5);
  const [selectedStrength, setSelectedStrength] = useState<number>(wine.strength);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [copyQuantity, setCopyQuantity] = useState<number>(1);
  const [copyLocation, setCopyLocation] = useState<string>(isHistory ? availableLocations[0] : wine.location);

  const t = (key: any) => getTranslation(language, key);

  const currentDate = new Date();
  const purchaseDate = new Date(wine.purchaseDate);
  const currentYear = currentDate.getFullYear();
  
  const historyEntry = isHistory ? (wine as HistoryEntry) : null;
  const endDate = historyEntry ? new Date(historyEntry.consumedDate) : currentDate;
  const yearsInCellar = Math.max(0, (endDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
  const age = currentYear - wine.year;
  const totalCost = wine.price * wine.quantity;

  let consumptionStatus: ConsumptionStatus = ConsumptionStatus.GREEN;
  if (currentYear > wine.recommendedYear) consumptionStatus = ConsumptionStatus.RED;
  else if (currentYear === wine.recommendedYear) consumptionStatus = ConsumptionStatus.ORANGE;

  const statusColorMap = {
    [ConsumptionStatus.RED]: 'bg-red-500',
    [ConsumptionStatus.ORANGE]: 'bg-orange-500',
    [ConsumptionStatus.GREEN]: 'bg-green-500',
  };

  const statusTextMap = {
    [ConsumptionStatus.RED]: t('expired'),
    [ConsumptionStatus.ORANGE]: t('ready_drink'),
    [ConsumptionStatus.GREEN]: t('wait'),
  };

  const handleConsumeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedStrength(wine.strength);
    setShowConsumeModal(true);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const handleDuplicateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCopyQuantity(1);
    setCopyLocation(isHistory ? availableLocations[0] : wine.location);
    setShowDuplicateModal(true);
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdateImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const confirmConsume = () => {
    if (onConsume) {
        onConsume(wine as Wine, rating, selectedStrength);
        setShowConsumeModal(false);
    }
  };

  const confirmDuplicate = () => {
      if (onDuplicate) {
          onDuplicate(wine as any, copyQuantity, copyLocation);
          setShowDuplicateModal(false);
      }
  }

  const hasImage = !!wine.image;

  const getFontSizeClasses = (size: AppFontSize) => {
    switch(size) {
      case 'small':
        return { title: 'text-sm', sub: 'text-[10px]', statsLabel: 'text-[8px]', statsValue: 'text-sm' };
      case 'large':
        return { title: 'text-2xl', sub: 'text-base', statsLabel: 'text-[10px]', statsValue: 'text-lg' };
      case 'medium':
      default:
        return { title: 'text-xl', sub: 'text-sm', statsLabel: 'text-[9px]', statsValue: 'text-base' };
    }
  };

  const fontClasses = getFontSizeClasses(fontSize as AppFontSize);

  return (
    <div className={`min-h-full relative ${hasImage ? 'bg-stone-900' : 'bg-stone-50 dark:bg-black'} transition-colors duration-300`}>
      <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
      {hasImage && (
        <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${wine.image})` }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        </div>
      )}
      <div className="sticky top-0 left-0 right-0 z-20 p-4 flex justify-between items-start pointer-events-none">
        <button onClick={onBack} className="pointer-events-auto bg-white/90 dark:bg-black/50 backdrop-blur text-stone-800 dark:text-stone-200 p-2.5 rounded-full shadow-lg hover:bg-white dark:hover:bg-stone-900 transition"><ArrowLeft size={24} /></button>
        <div className="flex items-center gap-3 pointer-events-auto">
            {onEdit && (<button onClick={onEdit} className="bg-white/90 dark:bg-black/50 backdrop-blur text-stone-800 dark:text-stone-200 p-2.5 rounded-full shadow-lg hover:bg-white dark:hover:bg-stone-900 transition"><Pencil size={20} /></button>)}
            {!isHistory && (<div className="bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold border border-white/20 shadow-sm">{(wine as Wine).location}</div>)}
        </div>
      </div>
      <div className={`relative z-10 pb-20 px-1.5 transition-all duration-500 ${hasImage ? 'pt-48' : 'pt-4'}`}>
        {isHistory && !hasImage && (
           <div onClick={() => fileInputRef.current?.click()} className="mb-6 mx-2.5 flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-stone-700 rounded-2xl bg-white/80 dark:bg-stone-900 shadow-sm transition-all hover:bg-white dark:hover:bg-stone-800 cursor-pointer">
              <div className="mx-auto h-16 w-16 bg-rose-50 dark:bg-rose-900/20 text-rose-300 dark:text-rose-500 rounded-full flex items-center justify-center mb-3"><Camera size={32} /></div>
              <div className="flex flex-col items-center text-center"><span className="text-sm font-bold text-rose-700 dark:text-rose-400">{t('take_photo')}</span><span className="text-[10px] font-bold text-gray-400 dark:text-stone-500 mt-1 uppercase tracking-wider">{t('gallery')}</span></div>
           </div>
        )}
        <div className={`rounded-3xl p-6 shadow-2xl space-y-6 ${hasImage ? 'bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl border border-white/40 dark:border-stone-800' : 'bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800'} transition-colors duration-300`}>
          <div>
            <div className="flex justify-between items-start gap-4">
                <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white leading-tight">{wine.name}</h1>
                {isHistory && historyEntry && (<div className="flex flex-col items-end"><div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-900/50 shadow-sm"><span className="font-bold text-lg">{historyEntry.consumptionRating}</span><Star size={16} fill="currentColor" /></div></div>)}
            </div>
            <p className="text-gray-600 dark:text-gray-300 font-medium text-lg mt-1">{wine.appellation} - {wine.year} {!isHistory && <span className="text-sm text-gray-400"> ({age} {t('years_old')})</span>}</p>
            <div className="flex items-center gap-2 mt-3">
              <span className={`inline-block w-3 h-3 rounded-full shadow-sm ring-1 ring-offset-1 ring-gray-200 dark:ring-stone-700 ${wine.color === 'Rouge' ? 'bg-red-800' : wine.color === 'Blanc' ? 'bg-yellow-200' : 'bg-pink-300'}`}></span>
              <span className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">{wine.region}, {wine.country}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 bg-stone-50/50 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-200/60 dark:border-stone-800">
            <div className="text-center">
              <p className={`text-stone-400 dark:text-stone-500 uppercase font-bold tracking-wide ${fontClasses.statsLabel}`}>{isHistory ? t('consumed') : t('quantity')}</p>
              <p className={`font-bold text-stone-800 dark:text-stone-100 leading-tight ${fontClasses.statsValue}`}>{wine.quantity}</p>
            </div>
            <div className="text-center border-l border-stone-200 dark:border-stone-700">
              <p className={`text-stone-400 dark:text-stone-500 uppercase font-bold tracking-wide ${fontClasses.statsLabel}`}>{t('price')}</p>
              <p className={`font-bold text-stone-800 dark:text-stone-100 leading-tight ${fontClasses.statsValue}`}>{wine.price.toLocaleString(language, { style: 'currency', currency: 'EUR', maximumFractionDigits: 1 })}</p>
            </div>
            <div className="text-center border-l border-stone-200 dark:border-stone-700 bg-rose-50 dark:bg-rose-900/20 rounded-r-lg -my-4 py-4 flex flex-col justify-center">
              <p className={`text-rose-800 dark:text-rose-300 uppercase font-bold tracking-wide ${fontClasses.statsLabel}`}>{t('total_cost')}</p>
              <p className={`font-bold text-rose-700 dark:text-rose-400 leading-tight ${fontClasses.statsValue}`}>{totalCost.toLocaleString(language, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 shadow-sm transition-colors">
              <div className="flex items-center gap-3">
                <div className={`p-2 ${isHistory ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-300' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-300'} rounded-full`}>{isHistory ? <ShoppingBag size={18} /> : <Clock size={18} />}</div>
                <div><p className="text-sm font-bold text-stone-800 dark:text-stone-200">{isHistory ? t('purchase_date') : t('time_in_cellar')}</p><p className="text-[10px] text-stone-500 dark:text-stone-400">{isHistory ? new Date(wine.purchaseDate).toLocaleDateString() : `${t('purchase_date')}: ${new Date(wine.purchaseDate).toLocaleDateString()}`}</p></div>
              </div>
              {!isHistory && (<span className="font-bold text-blue-900 dark:text-blue-200">{yearsInCellar} {t('years_old')}</span>)}
            </div>
            {isHistory && historyEntry ? (
                 <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 shadow-sm transition-colors">
                    <div className="flex items-center gap-3"><div className="p-2 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-full"><Check size={18} /></div><div><p className="text-sm font-bold text-stone-800 dark:text-stone-200">Date consommation</p><p className="text-[10px] text-stone-500 dark:text-stone-400">Ajouté à l'historique</p></div></div>
                    <span className="font-bold text-amber-900 dark:text-amber-200">{new Date(historyEntry.consumedDate).toLocaleDateString()}</span>
                 </div>
            ) : (
                <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 shadow-sm transition-colors">
                <div className="flex items-center gap-3"><div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-500 dark:text-purple-300 rounded-full"><Calendar size={18} /></div><div><p className="text-sm font-bold text-stone-800 dark:text-stone-200">Consommation</p><p className="text-[10px] text-stone-500 dark:text-stone-400">Idéal en {wine.recommendedYear}</p></div></div>
                <div className="flex items-center gap-2 px-2 py-1 bg-stone-50 dark:bg-stone-700 rounded-lg border border-stone-100 dark:border-stone-600"><div className={`w-3 h-3 rounded-full ${statusColorMap[consumptionStatus]}`}></div><span className="text-xs font-bold text-stone-600 dark:text-stone-300">{statusTextMap[consumptionStatus]}</span></div>
                </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm pt-2">
              <div><p className="text-stone-400 dark:text-stone-500 text-xs font-bold uppercase mb-1">{t('origin')}</p><p className="text-stone-800 dark:text-stone-200 font-medium">{wine.origin || 'N/A'}</p></div>
               <div><p className="text-stone-400 dark:text-stone-500 text-xs font-bold uppercase mb-1">{t('purchase_place')}</p><p className="text-stone-800 dark:text-stone-200 font-medium">{wine.purchasePlace || 'N/A'}</p></div>
               <div><p className="text-stone-400 dark:text-stone-500 text-xs font-bold uppercase mb-1">{t('strength')}</p><div className="flex items-center gap-2"><div className="flex-1 bg-stone-200 dark:bg-stone-700 rounded-full h-2"><div className="bg-rose-900 dark:bg-rose-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${wine.strength}%` }}></div></div><span className="text-xs font-bold text-rose-900 dark:text-rose-400">{wine.strength}%</span></div></div>
               {!isHistory && (<div><p className="text-stone-400 dark:text-stone-500 text-xs font-bold uppercase mb-1">{t('aging')}</p><p className="text-stone-800 dark:text-stone-200 font-medium">{wine.agingPotential}</p></div>)}
              <div className="col-span-2"><p className="text-stone-400 dark:text-stone-500 text-xs font-bold uppercase mb-2 flex items-center gap-1"><Tag size={12}/> {t('tag')}</p><div className="flex flex-wrap gap-2">{wine.tag ? wine.tag.split(',').map((t, i) => (<span key={i} className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-2.5 py-1 rounded-md text-xs font-medium border border-stone-200 dark:border-stone-700">{t.trim()}</span>)) : <span className="text-stone-300 dark:text-stone-600 italic">{t('no_tag')}</span>}</div></div>
               <div className="col-span-2 bg-amber-50/80 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30"><p className="text-amber-800 dark:text-amber-500 text-xs font-bold uppercase mb-1">{t('personal_note')}</p><p className="text-stone-800 dark:text-stone-200 italic leading-relaxed">"{wine.note || t('no_note')}"</p></div>
          </div>
          <div className="pt-4 flex gap-3">
               <button type="button" onClick={handleDeleteClick} className={`${isHistory ? 'flex-1' : 'flex-none p-4'} rounded-xl border border-red-200 dark:border-red-900/50 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition cursor-pointer flex items-center justify-center gap-2`}>
                 <Trash2 size={20} />
                 {isHistory && <span className="font-bold">{t('delete')}</span>}
              </button>
              {isHistory && (<button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-100 font-bold py-4 px-6 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-700 transition active:scale-95 cursor-pointer"><Camera size={20} /><span>{t('take_photo')}</span></button>)}
              {!isHistory && (
                <>
                <button type="button" onClick={handleDuplicateClick} className="flex-none p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/50 text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/10 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 transition cursor-pointer"><Copy size={20} /></button>
                <button type="button" onClick={handleConsumeClick} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-rose-900 to-rose-800 dark:from-rose-700 dark:to-rose-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-rose-900/20 hover:shadow-xl transition transform active:scale-95 cursor-pointer"><Check size={20} /><span>{t('consume_bottle')}</span></button>
                </>
              )}
          </div>
        </div>
      </div>
      {showConsumeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConsumeModal(false)}/>
           <div className="relative bg-white dark:bg-stone-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl transition-colors max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">{t('rate_wine')}</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">{wine.quantity === 1 ? t('consume_msg_single') : t('consume_msg_multi')}<br/>Attribuez une note et ajustez l'intensité si nécessaire.</p>
            <div className="mb-6"><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Note</label><div className="flex justify-between px-2">{RATINGS.map(r => (<button key={r} onClick={() => setRating(r)} className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all duration-200 ${rating === r ? 'bg-rose-900 dark:bg-rose-700 text-white scale-110 shadow-lg shadow-rose-900/30' : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700'}`}>{r}</button>))}</div></div>
            <div className="mb-8"><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">{t('strength')}</label><div className="flex justify-between gap-1 px-1">{[...STRENGTHS].reverse().map(s => (<button key={s} onClick={() => setSelectedStrength(s)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${selectedStrength === s ? 'bg-rose-900 dark:bg-rose-700 text-white shadow-md' : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500'}`}>{s}%</button>))}</div></div>
            <div className="flex gap-3"><button onClick={() => setShowConsumeModal(false)} className="flex-1 py-3 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-medium hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer">{t('cancel')}</button><button onClick={confirmConsume} className="flex-1 py-3 rounded-xl bg-rose-900 dark:bg-rose-700 text-white font-bold hover:bg-rose-800 dark:hover:bg-rose-600 shadow-lg shadow-rose-900/20 cursor-pointer">{t('confirm')}</button></div>
          </div>
        </div>
      )}
      {showDuplicateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDuplicateModal(false)}/>
             <div className="relative bg-white dark:bg-stone-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl transition-colors max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-4">{t('duplicate_bottle')}</h3>
              <div className="space-y-4 mb-6">
                <div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{t('target_location')}</label><select value={copyLocation} onChange={(e) => setCopyLocation(e.target.value)} className="w-full rounded-xl border border-gray-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-gray-900 dark:text-white p-3 shadow-sm focus:border-rose-500 focus:ring-rose-500">{availableLocations.map(l => (<option key={l} value={l}>{l}</option>))}</select></div>
                <div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{t('copy_quantity')}</label><input type="number" min="1" value={copyQuantity} onChange={(e) => setCopyQuantity(Math.max(1, parseInt(e.target.value)))} className="w-full rounded-xl border border-gray-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-gray-900 dark:text-white p-3 shadow-sm focus:border-rose-500 focus:ring-rose-500"/></div>
              </div>
              <div className="flex gap-3"><button onClick={() => setShowDuplicateModal(false)} className="flex-1 py-3 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-medium hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer">{t('cancel')}</button><button onClick={confirmDuplicate} className="flex-1 py-3 rounded-xl bg-indigo-600 dark:bg-indigo-700 text-white font-bold hover:bg-indigo-700 dark:hover:bg-indigo-600 shadow-lg shadow-indigo-600/20 cursor-pointer">{t('confirm')}</button></div>
            </div>
          </div>
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}/>
           <div className="relative bg-white dark:bg-stone-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl transition-colors border border-stone-100 dark:border-stone-800">
            <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-4">{t('confirm')}</h3>
            <p className="text-stone-600 dark:text-stone-300 mb-8 leading-relaxed">{isHistory ? t('delete_history_confirm') : t('delete_confirm')}</p>
            <div className="flex gap-3"><button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-medium hover:bg-stone-50 dark:hover:bg-stone-800 transition cursor-pointer">{t('cancel')}</button><button onClick={() => onDelete(wine.id)} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-600/20 transition cursor-pointer">{t('confirm')}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};
