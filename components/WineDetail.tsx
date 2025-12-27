
import React, { useState, useRef } from 'react';
import { ArrowLeft, Check, Calendar, Clock, Tag, Trash2, Star, Pencil, Copy, Camera, ShoppingBag, Wine as WineIcon, Minus, Plus, Maximize2, Move, Warehouse } from 'lucide-react';
import { Wine, ConsumptionStatus, HistoryEntry, Language, AppFontSize, Cellar } from '../types';
import { RATINGS, STRENGTHS } from '../constants';
import { getTranslation } from '../translations';

interface WineDetailProps {
  wine: Wine | HistoryEntry;
  cellars: Cellar[];
  currentCellarId: string;
  onBack: () => void;
  onConsume?: (wine: Wine, rating: number, strength: number, quantity: number) => void;
  onDelete: (id: string) => void;
  onEdit?: () => void;
  onTransfer?: (wine: Wine, targetCellarId: string, quantity: number, location: string, isMove: boolean) => void;
  onUpdateImage?: (image: string) => void;
  onEnlargeImage?: (image: string) => void;
  availableLocations: string[];
  isHistory?: boolean;
  language: Language;
  fontSize?: AppFontSize;
}

export const WineDetail: React.FC<WineDetailProps> = ({ wine, cellars, currentCellarId, onBack, onConsume, onDelete, onEdit, onTransfer, onUpdateImage, onEnlargeImage, availableLocations, isHistory = false, language, fontSize = 'medium' }) => {
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transferModal, setTransferModal] = useState<{ isOpen: boolean, isMove: boolean }>({ isOpen: false, isMove: false });
  
  const [rating, setRating] = useState<number>(5);
  const [consumeQty, setConsumeQty] = useState<number>(1);
  const [selectedStrength, setSelectedStrength] = useState<number>(wine.strength);

  const [targetCellarId, setTargetCellarId] = useState(currentCellarId);
  const [transferQty, setTransferQty] = useState(1);
  const [targetLocation, setTargetLocation] = useState(isHistory ? availableLocations[0] : wine.location);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = (key: any) => getTranslation(language, key);

  const currentCellar = cellars.find(c => c.id === currentCellarId) || cellars[0];
  const targetCellar = cellars.find(c => c.id === targetCellarId) || currentCellar;

  const handleTransferClick = (isMove: boolean) => {
    setTransferModal({ isOpen: true, isMove });
    setTargetCellarId(isMove ? (cellars.find(c => c.id !== currentCellarId)?.id || currentCellarId) : currentCellarId);
    setTransferQty(1);
    setTargetLocation(availableLocations[0]);
  };

  const confirmTransfer = () => {
    if (onTransfer) {
      onTransfer(wine as Wine, targetCellarId, transferQty, targetLocation, transferModal.isMove);
      setTransferModal({ isOpen: false, isMove: false });
    }
  };

  const getFontSizeClasses = (size: AppFontSize) => {
    switch(size) {
      case 'small': return { title: 'text-lg', sub: 'text-xs', statsLabel: 'text-[8px]', statsValue: 'text-sm', infoText: 'text-xs', cellarBadge: 'text-[9px]' };
      case 'large': return { title: 'text-4xl', sub: 'text-xl', statsLabel: 'text-[11px]', statsValue: 'text-xl', infoText: 'text-lg', cellarBadge: 'text-xs' };
      case 'medium':
      default: return { title: 'text-3xl', sub: 'text-lg', statsLabel: 'text-[9px]', statsValue: 'text-base', infoText: 'text-base', cellarBadge: 'text-[10px]' };
    }
  };

  const fs = getFontSizeClasses(fontSize as AppFontSize);
  const totalCost = wine.price * wine.quantity;
  const age = new Date().getFullYear() - wine.year;

  return (
    <div className={`min-h-full relative ${wine.image ? 'bg-stone-900' : 'bg-stone-100 dark:bg-black'} transition-colors duration-300`}>
      <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={(e) => {
        const file = e.target.files?.[0];
        if (file && onUpdateImage) {
          const reader = new FileReader();
          reader.onloadend = () => onUpdateImage(reader.result as string);
          reader.readAsDataURL(file);
        }
      }} className="hidden" />
      
      {wine.image && (
        <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${wine.image})` }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        </div>
      )}

      <div className="sticky top-0 left-0 right-0 z-20 p-4 flex justify-between items-start pointer-events-none">
        <button onClick={onBack} className="pointer-events-auto bg-white/90 dark:bg-black/50 backdrop-blur text-stone-800 dark:text-stone-200 p-2.5 rounded-full shadow-lg active:scale-95 transition"><ArrowLeft size={24} /></button>
        <div className="flex items-center gap-3 pointer-events-auto">
          {onEnlargeImage && wine.image && (
            <button onClick={() => onEnlargeImage(wine.image!)} className="bg-white/90 dark:bg-black/50 backdrop-blur text-stone-800 dark:text-stone-200 p-2.5 rounded-full shadow-lg active:scale-95 transition"><Maximize2 size={20} /></button>
          )}
          {onEdit && (<button onClick={onEdit} className="bg-white/90 dark:bg-black/50 backdrop-blur text-stone-800 dark:text-stone-200 p-2.5 rounded-full shadow-lg active:scale-95 transition"><Pencil size={20} /></button>)}
          
          {!isHistory && (
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-1 py-1 rounded-full border border-white/20 shadow-sm">
              <div className="w-7 h-7 rounded-full overflow-hidden border border-white/40 shadow-sm bg-stone-800 flex-shrink-0">
                {currentCellar.image ? <img src={currentCellar.image} className="w-full h-full object-cover" /> : <Warehouse size={12} className="m-auto mt-1.5 text-white/50" />}
              </div>
              <div className={`pr-3 text-white font-bold whitespace-nowrap ${fs.cellarBadge}`}>{activeCellarName(wine, currentCellar)} / {wine.location}</div>
            </div>
          )}
        </div>
      </div>

      <div className={`relative z-10 pb-20 px-1.5 transition-all duration-500 ${wine.image ? 'pt-48' : 'pt-4'}`}>
        <div className={`rounded-3xl p-6 shadow-2xl space-y-6 ${wine.image ? 'bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl border border-white/40 dark:border-stone-800' : 'bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800'} transition-colors duration-300`}>
          <div>
            <div className="flex justify-between items-start gap-4">
                <h1 className={`font-serif font-bold text-gray-900 dark:text-white leading-tight ${fs.title}`}>{wine.name}</h1>
                {isHistory && (wine as HistoryEntry).consumptionRating && (
                  <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-900/50 shadow-sm">
                    <span className="font-bold text-lg">{(wine as HistoryEntry).consumptionRating}</span><Star size={16} fill="currentColor" />
                  </div>
                )}
            </div>
            <p className={`text-gray-600 dark:text-gray-300 font-medium mt-1 ${fs.sub}`}>{wine.appellation} - {wine.year} {!isHistory && <span className="text-sm text-gray-400"> ({age} {t('years_old')})</span>}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-stone-50/50 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-200/60 dark:border-stone-800">
            <div className="text-center">
              <p className={`text-stone-400 dark:text-stone-500 uppercase font-bold tracking-wide ${fs.statsLabel}`}>{isHistory ? t('consumed') : t('quantity')}</p>
              <p className={`font-bold text-stone-800 dark:text-stone-100 leading-tight ${fs.statsValue}`}>{wine.quantity}</p>
            </div>
            <div className="text-center border-l border-stone-200 dark:border-stone-700">
              <p className={`text-stone-400 dark:text-stone-500 uppercase font-bold tracking-wide ${fs.statsLabel}`}>{t('price')}</p>
              <p className={`font-bold text-stone-800 dark:text-stone-100 leading-tight ${fs.statsValue}`}>{wine.price.toLocaleString(language, { style: 'currency', currency: 'EUR', maximumFractionDigits: 1 })}</p>
            </div>
            <div className="text-center border-l border-stone-200 dark:border-stone-700 bg-rose-50 dark:bg-rose-900/20 rounded-r-lg -my-4 py-4 flex flex-col justify-center">
              <p className={`text-rose-800 dark:text-rose-300 uppercase font-bold tracking-wide ${fs.statsLabel}`}>{t('total_cost')}</p>
              <p className={`font-bold text-rose-700 dark:text-rose-400 leading-tight ${fs.statsValue}`}>{totalCost.toLocaleString(language, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm pt-2">
               <div><p className="text-stone-400 dark:text-stone-500 text-xs font-bold uppercase mb-1">{t('region')}</p><p className={`text-stone-800 dark:text-stone-200 font-medium ${fs.infoText}`}>{wine.region}, {wine.country}</p></div>
               <div><p className="text-stone-400 dark:text-stone-500 text-xs font-bold uppercase mb-1">{t('strength')}</p><div className="flex items-center gap-2"><div className="flex-1 bg-stone-200 dark:bg-stone-700 rounded-full h-2"><div className="bg-rose-900 dark:bg-rose-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${wine.strength}%` }}></div></div><span className={`font-bold text-rose-900 dark:text-rose-400 ${fs.infoText}`}>{wine.strength}%</span></div></div>
               <div className="col-span-2 bg-amber-50/80 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30"><p className="text-amber-800 dark:text-amber-500 text-xs font-bold uppercase mb-1">{t('personal_note')}</p><p className={`text-stone-800 dark:text-stone-200 italic leading-relaxed ${fs.infoText}`}>"{wine.note || t('no_note')}"</p></div>
          </div>

          <div className="pt-4 flex gap-3">
               <button type="button" onClick={() => setShowDeleteModal(true)} className={`${isHistory ? 'flex-1' : 'flex-none p-4'} rounded-xl border border-red-200 dark:border-red-900/50 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 transition cursor-pointer flex items-center justify-center gap-2`}>
                 <Trash2 size={20} />
                 {isHistory && <span className="font-bold">{t('delete')}</span>}
              </button>
              {!isHistory && (
                <>
                <button type="button" onClick={() => handleTransferClick(false)} className="flex-none p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/50 text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/10 hover:bg-indigo-100 transition cursor-pointer"><Copy size={20} /></button>
                {cellars.length > 1 && (
                  <button type="button" onClick={() => handleTransferClick(true)} className="flex-none p-4 rounded-xl border border-orange-200 dark:border-orange-900/50 text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/10 hover:bg-orange-100 transition cursor-pointer"><Move size={20} /></button>
                )}
                <button type="button" onClick={() => setShowConsumeModal(true)} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-rose-900 to-rose-800 dark:from-rose-700 dark:to-rose-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-rose-900/20 hover:shadow-xl transition transform active:scale-95 cursor-pointer">
                  <Check size={20} /><span>{t('consume_bottle')}</span>
                </button>
                </>
              )}
          </div>
        </div>
      </div>

      {/* --- MODAL CONSOMMATION --- */}
      {showConsumeModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="relative bg-white dark:bg-stone-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">{t('rate_wine')}</h3>
            <div className="mb-6">
              <label className="block text-xs font-bold text-stone-500 uppercase mb-3">{t('quantity_consumed')}</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setConsumeQty(prev => Math.max(1, prev - 1))} className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center border border-stone-200 active:scale-90 transition-all"><Minus size={20} /></button>
                <div className="flex-1 h-12 bg-stone-50 dark:bg-stone-900 border border-stone-200 rounded-xl flex items-center justify-center font-bold text-lg text-stone-900 dark:text-white">{consumeQty}</div>
                <button onClick={() => setConsumeQty(prev => Math.min(wine.quantity, prev + 1))} className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center border border-stone-200 active:scale-90 transition-all"><Plus size={20} /></button>
              </div>
            </div>
            <div className="mb-6"><label className="block text-xs font-bold text-stone-500 uppercase mb-3">Note</label><div className="flex justify-between px-2">{RATINGS.map(r => (<button key={r} onClick={() => setRating(r)} className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold transition-all ${rating === r ? 'bg-rose-900 dark:bg-rose-700 text-white scale-110 shadow-lg' : 'bg-stone-100 dark:bg-stone-800 text-stone-400'}`}>{r}</button>))}</div></div>
            <div className="flex gap-3"><button onClick={() => setShowConsumeModal(false)} className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-600 dark:text-stone-300 font-medium hover:bg-stone-50">{t('cancel')}</button><button onClick={() => onConsume?.(wine as Wine, rating, selectedStrength, consumeQty)} className="flex-1 py-3 rounded-xl bg-rose-900 dark:bg-rose-700 text-white font-bold hover:bg-rose-800 shadow-lg">{t('confirm')}</button></div>
          </div>
        </div>
      )}

      {/* --- MODAL TRANSFERT / COPIE --- */}
      {transferModal.isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="relative bg-white dark:bg-stone-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl overflow-y-auto no-scrollbar max-h-[90vh]">
            <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-4">{transferModal.isMove ? t('transfer_bottle') : t('duplicate_bottle')}</h3>
            <div className="space-y-6">
              <div className="space-y-4">
                {cellars.map((c: Cellar) => (
                  <div key={c.id} onClick={() => setTargetCellarId(c.id)} className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${targetCellarId === c.id ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-900/30' : 'bg-white dark:bg-stone-800 border-stone-100 dark:border-stone-700 shadow-sm'}`}>
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white dark:border-stone-600 shadow-sm flex-shrink-0">
                      {c.image ? <img src={c.image} className="w-full h-full object-cover" /> : <Warehouse size={16} className="m-auto mt-2.5 text-stone-300" />}
                    </div>
                    <span className={`font-bold flex-1 truncate ${targetCellarId === c.id ? 'text-rose-900 dark:text-rose-400' : 'text-stone-600 dark:text-stone-300'}`}>{c.name}</span>
                    {targetCellarId === c.id && <Check size={18} className="text-rose-900 dark:text-rose-400" />}
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase mb-2">{t('target_location')}</label>
                  <select value={targetLocation} onChange={(e) => setTargetLocation(e.target.value)} className="w-full p-4 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-white">
                    {getCellarShelves(targetCellar, language).map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase mb-2">{transferModal.isMove ? t('transfer_to') : t('copy_quantity')}</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setTransferQty(prev => Math.max(1, prev - 1))} className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center border active:scale-90 transition-all"><Minus size={20} /></button>
                    <div className="flex-1 h-12 bg-stone-50 dark:bg-stone-900 border rounded-xl flex items-center justify-center font-bold text-lg text-stone-900 dark:text-white">{transferQty}</div>
                    <button onClick={() => setTransferQty(prev => Math.min(transferModal.isMove ? wine.quantity : 100, prev + 1))} className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center border active:scale-90 transition-all"><Plus size={20} /></button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setTransferModal({ isOpen: false, isMove: false })} className="flex-1 py-3 rounded-xl border text-stone-600 dark:text-stone-300 font-bold">{t('cancel')}</button>
                <button onClick={confirmTransfer} className="flex-1 py-3 rounded-xl bg-rose-900 dark:bg-rose-700 text-white font-bold shadow-lg">{t('confirm')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-white dark:bg-stone-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-4">{t('confirm')}</h3>
            <p className="text-stone-600 dark:text-stone-300 mb-8">{isHistory ? t('delete_history_confirm') : t('delete_confirm')}</p>
            <div className="flex gap-3"><button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 rounded-xl border text-stone-600 font-medium">{t('cancel')}</button><button onClick={() => onDelete(wine.id)} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold">{t('confirm')}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

function activeCellarName(wine: Wine | HistoryEntry, currentCellar: Cellar) {
  return currentCellar.name;
}

function getCellarShelves(cellar: Cellar, language: Language) {
  const prefix = getTranslation(cellar.settings.language, 'shelf_prefix');
  const shelves = Array.from({ length: cellar.settings.shelfCount }, (_, i) => `${prefix} ${i + 1}`);
  return [...shelves, getTranslation(cellar.settings.language, 'off_site')];
}
