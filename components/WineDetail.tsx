
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Check, Calendar, Clock, Tag, Trash2, Star, Pencil, Copy, Eye, Camera, ShoppingBag, Wine as WineIcon, Minus, Plus, Move, Warehouse, Map as MapIcon, Sparkles, Loader2, ExternalLink } from 'lucide-react';
import { Wine, ConsumptionStatus, HistoryEntry, Language, AppFontSize, Cellar } from '../types';
import { RATINGS, STRENGTHS } from '../constants';
import { getTranslation } from '../translations';
import { GoogleGenAI } from "@google/genai";

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

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = (key: any) => getTranslation(language, key);

  const currentCellar = cellars.find(c => c.id === currentCellarId) || cellars[0];
  const targetCellar = cellars.find(c => c.id === targetCellarId) || currentCellar;

  useEffect(() => {
    const fetchAiSummary = async () => {
      if (aiSummary || isSummarizing) return;
      setIsSummarizing(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Write a short, elegant and professional sommelier summary (max 100 words) for the following wine: ${wine.name}, ${wine.appellation}, ${wine.year}, ${wine.region}, ${wine.country}. 
        Include: a brief mention of the estate's history or terroir, the typical aromatic profile for this vintage, and a suggested food pairing. 
        Language: ${language === 'fr' ? 'French' : 'English'}. Keep it concise and inspiring.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [{ parts: [{ text: prompt }] }],
        });

        if (response.text) {
          setAiSummary(response.text.trim());
        }
      } catch (error) {
        console.error("AI Summary generation failed:", error);
      } finally {
        setIsSummarizing(false);
      }
    };

    fetchAiSummary();
  }, [wine.id, language]);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdateImage) {
      const reader = new FileReader();
      reader.onloadend = () => onUpdateImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const getFontSizeClasses = (size: AppFontSize) => {
    switch(size) {
      case 'small': return { title: 'text-lg', sub: 'text-xs', statsLabel: 'text-[8px]', statsValue: 'text-sm', infoText: 'text-xs', cellarBadge: 'text-xs' };
      case 'large': return { title: 'text-4xl', sub: 'text-xl', statsLabel: 'text-[11px]', statsValue: 'text-xl', infoText: 'text-lg', cellarBadge: 'text-base' };
      case 'medium':
      default: return { title: 'text-3xl', sub: 'text-lg', statsLabel: 'text-[9px]', statsValue: 'text-base', infoText: 'text-base', cellarBadge: 'text-sm' };
    }
  };

  const fs = getFontSizeClasses(fontSize as AppFontSize);

  const purchaseDate = new Date(wine.purchaseDate);
  const historyEntry = isHistory ? (wine as HistoryEntry) : null;
  const endDate = historyEntry ? new Date(historyEntry.consumedDate) : new Date();
  const yearsInCellar = Math.max(0, (endDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
  const totalCost = wine.price * wine.quantity;
  const age = new Date().getFullYear() - wine.year;

  let consumptionStatus: ConsumptionStatus = ConsumptionStatus.GREEN;
  const curYear = new Date().getFullYear();
  if (curYear > wine.recommendedYear) consumptionStatus = ConsumptionStatus.RED;
  else if (curYear === wine.recommendedYear) consumptionStatus = ConsumptionStatus.ORANGE;

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

  const mapSearchQuery = encodeURIComponent(`${wine.name} ${wine.region} ${wine.country}`);
  const mapEmbedUrl = `https://maps.google.com/maps?q=${mapSearchQuery}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
  const mapDirectUrl = `https://www.google.com/maps/search/?api=1&query=${mapSearchQuery}`;

  // Style standardisé pour les champs
  const inputClass = `w-full p-4 rounded-xl bg-[var(--theme-bg-soft)] dark:bg-stone-800 border-2 border-[var(--theme-border)] focus:border-[var(--theme-primary)] text-stone-800 dark:text-white outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/20 transition-all ${fs.infoText}`;

  return (
    <div className={`min-h-full relative ${wine.image ? 'bg-stone-900' : 'bg-stone-100 dark:bg-black'} transition-colors duration-300`}>
      {!isHistory && <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleImageChange} className="hidden" />}
      
      {wine.image && (
        <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${wine.image})` }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        </div>
      )}

      <div className="sticky top-0 left-0 right-0 z-20 p-4 flex justify-between items-start pointer-events-none">
        <button onClick={onBack} className="pointer-events-auto bg-white/90 dark:bg-black/50 backdrop-blur text-stone-800 dark:text-stone-200 p-2.5 rounded-full shadow-lg active:scale-95 transition"><ArrowLeft size={24} /></button>
        <div className="flex items-center gap-3 pointer-events-auto">
          {onEnlargeImage && wine.image && (
            <button onClick={() => onEnlargeImage(wine.image!)} className="bg-white/90 dark:bg-black/50 backdrop-blur text-stone-800 dark:text-stone-200 p-2.5 rounded-full shadow-lg active:scale-95 transition"><Eye size={20} /></button>
          )}
          {onEdit && (<button onClick={onEdit} className="bg-white/90 dark:bg-black/50 backdrop-blur text-stone-800 dark:text-stone-200 p-2.5 rounded-full shadow-lg active:scale-95 transition"><Pencil size={20} /></button>)}
          
          {!isHistory ? (
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-1 py-1 rounded-full border border-white/20 shadow-sm">
              <div className="w-7 h-7 rounded-full overflow-hidden border border-white/40 shadow-sm bg-stone-800 flex-shrink-0">
                {currentCellar.image ? <img src={currentCellar.image} className="w-full h-full object-cover" /> : <Warehouse size={12} className="m-auto mt-1.5 text-white/50" />}
              </div>
              <div className={`pr-3 text-white font-bold whitespace-nowrap ${fs.cellarBadge}`}>{currentCellar.name} / {wine.location}</div>
            </div>
          ) : (
            historyEntry?.originalCellarName && (
              <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
                 <Warehouse size={14} className="text-white/60" />
                 <div className={`text-white font-bold whitespace-nowrap ${fs.cellarBadge}`}>{historyEntry.originalCellarName}</div>
              </div>
            )
          )}
        </div>
      </div>

      <div className={`relative z-10 pb-20 px-1.5 transition-all duration-500 ${wine.image ? 'pt-48' : 'pt-4'}`}>
        
        <div className={`rounded-3xl p-6 shadow-2xl space-y-6 ${wine.image ? 'bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl border border-white/40 dark:border-stone-800' : 'bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800'} transition-colors duration-300`}>
          <div>
            <div className="flex justify-between items-start gap-4">
                <h1 className={`font-serif font-bold text-gray-900 dark:text-white leading-tight ${fs.title}`}>{wine.name}</h1>
                {isHistory && historyEntry && (
                  <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-900/50 shadow-sm">
                    <span className="font-bold text-lg">{historyEntry.consumptionRating}</span><Star size={16} fill="currentColor" />
                  </div>
                )}
            </div>
            <p className={`text-gray-600 dark:text-gray-300 font-medium mt-1 ${fs.sub}`}>{wine.appellation} - {wine.year} {!isHistory && <span className="text-sm text-gray-400"> ({age} {t('years_old')})</span>}</p>
            <div className="flex items-center gap-2 mt-3">
              <span className={`inline-block w-3 h-3 rounded-full shadow-sm ring-1 ring-offset-1 ring-gray-200 dark:ring-stone-700 ${wine.color === 'Rouge' ? 'bg-red-800' : wine.color === 'Blanc' ? 'bg-yellow-200' : 'bg-pink-300'}`}></span>
              <span className={`text-stone-500 dark:text-stone-400 uppercase tracking-wide font-semibold ${fs.infoText}`}>{wine.region}, {wine.country}</span>
            </div>
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
            <div className={`text-center border-l border-stone-200 dark:border-stone-700 bg-[var(--theme-bg-soft)] dark:bg-rose-900/20 rounded-r-lg -my-4 py-4 flex flex-col justify-center`}>
              <p className={`text-[var(--theme-primary)] dark:text-rose-300 uppercase font-bold tracking-wide ${fs.statsLabel}`}>{t('total_cost')}</p>
              <p className={`font-bold text-[var(--theme-primary)] dark:text-rose-400 leading-tight ${fs.statsValue}`}>{totalCost.toLocaleString(language, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 shadow-sm transition-colors">
              <div className="flex items-center gap-3">
                <div className={`p-2 ${isHistory ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-300' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-300'} rounded-full`}>{isHistory ? <ShoppingBag size={18} /> : <Clock size={18} />}</div>
                <div><p className={`font-bold text-stone-800 dark:text-stone-200 ${fs.infoText}`}>{isHistory ? t('purchase_date') : t('time_in_cellar')}</p><p className="text-[10px] text-stone-500 dark:text-stone-400">{isHistory ? new Date(wine.purchaseDate).toLocaleDateString() : `${t('purchase_date')}: ${new Date(wine.purchaseDate).toLocaleDateString()}`}</p></div>
              </div>
              {!isHistory && (<span className={`font-bold text-blue-900 dark:text-blue-200 ${fs.infoText}`}>{yearsInCellar} {t('years_old')}</span>)}
            </div>
            {isHistory && historyEntry ? (
                 <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 shadow-sm transition-colors">
                    <div className="flex items-center gap-3"><div className="p-2 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-full"><Check size={18} /></div><div><p className={`font-bold text-stone-800 dark:text-stone-200 ${fs.infoText}`}>{t('date_consumption')}</p><p className="text-[10px] text-stone-500 dark:text-stone-400">{t('added_to_history')}</p></div></div>
                    <span className={`font-bold text-amber-900 dark:text-amber-200 ${fs.infoText}`}>{new Date(historyEntry.consumedDate).toLocaleDateString()}</span>
                 </div>
            ) : (
                <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 shadow-sm transition-colors">
                <div className="flex items-center gap-3"><div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-500 dark:text-purple-300 rounded-full"><Calendar size={18} /></div><div><p className={`font-bold text-stone-800 dark:text-stone-200 ${fs.infoText}`}>{t('consumption')}</p><p className="text-[10px] text-stone-500 dark:text-stone-400">{t('ideal_in')} {wine.recommendedYear}</p></div></div>
                <div className="flex items-center gap-2 px-2 py-1 bg-stone-50 dark:bg-stone-700 rounded-lg border border-stone-100 dark:border-stone-600"><div className={`w-3 h-3 rounded-full ${statusColorMap[consumptionStatus]}`}></div><span className={`font-bold text-stone-600 dark:text-stone-300 ${fs.infoText}`}>{statusTextMap[consumptionStatus]}</span></div>
                </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm pt-2">
               <div><p className="text-stone-400 dark:text-stone-500 text-xs font-bold uppercase mb-1">{t('origin')}</p><p className={`text-stone-800 dark:text-stone-200 font-medium ${fs.infoText}`}>{wine.origin || 'N/A'}</p></div>
               <div><p className="text-stone-400 dark:text-stone-500 text-xs font-bold uppercase mb-1">{t('purchase_place')}</p><p className={`text-stone-800 dark:text-stone-200 font-medium ${fs.infoText}`}>{wine.purchasePlace || 'N/A'}</p></div>
               <div><p className="text-stone-400 dark:text-stone-500 text-xs font-bold uppercase mb-1">{t('strength')}</p><div className="flex items-center gap-2"><div className="flex-1 bg-stone-200 dark:bg-stone-700 rounded-full h-2"><div className="bg-[var(--theme-primary)] dark:bg-rose-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${wine.strength}%` }}></div></div><span className={`font-bold text-[var(--theme-primary)] dark:text-rose-400 ${fs.infoText}`}>{wine.strength}%</span></div></div>
               {!isHistory && (<div><p className="text-stone-400 dark:text-stone-500 text-xs font-bold uppercase mb-1">{t('aging')}</p><p className={`text-stone-800 dark:text-stone-200 font-medium ${fs.infoText}`}>{t('aging_' + wine.agingPotential)}</p></div>)}
               
               {isHistory && historyEntry?.originalCellarName && (
                 <div className="col-span-2 border-t border-stone-100 dark:border-stone-800 pt-4">
                    <p className="text-stone-400 dark:text-stone-500 text-xs font-bold uppercase mb-1">{t('original_cellar')}</p>
                    <p className={`text-stone-800 dark:text-stone-200 font-bold ${fs.infoText}`}>{historyEntry.originalCellarName}</p>
                 </div>
               )}

               <div className="col-span-2 border-t border-stone-100 dark:border-stone-800 pt-4"><p className="text-stone-400 dark:text-stone-500 text-xs font-bold uppercase mb-2 flex items-center gap-1"><Tag size={12}/> {t('tag')}</p><div className="flex flex-wrap gap-2">{wine.tag ? wine.tag.split(',').map((tVal, i) => (<span key={i} className={`bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-2.5 py-1 rounded-md font-medium border border-stone-200 dark:border-stone-700 ${fs.infoText}`}>{tVal.trim()}</span>)) : <span className="text-stone-300 dark:text-stone-600 italic">{t('no_tag')}</span>}</div></div>
               <div className="col-span-2 bg-amber-50/80 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30"><p className="text-amber-800 dark:text-amber-500 text-xs font-bold uppercase mb-1">{t('personal_note')}</p><p className={`text-stone-800 dark:text-stone-200 italic leading-relaxed ${fs.infoText}`}>"{wine.note || t('no_note')}"</p></div>
          </div>

          <div className="space-y-3 pt-4 border-t border-stone-100 dark:border-stone-800">
             <div className="flex items-center justify-between text-[var(--theme-primary)] dark:text-rose-400">
                <div className="flex items-center gap-2">
                   <MapIcon size={18} />
                   <span className={`font-bold uppercase tracking-wider ${fs.infoText}`}>{t('winery_location')}</span>
                </div>
                <a href={mapDirectUrl} className="flex items-center gap-1.5 text-xs font-bold bg-[var(--theme-bg-soft)] dark:bg-rose-900/20 px-3 py-1.5 rounded-lg border border-[var(--theme-border)] dark:border-rose-900/40 active:scale-95 transition-transform">
                   <ExternalLink size={14} />
                   <span>Google Maps</span>
                </a>
             </div>
             <a 
               href={mapDirectUrl}
               className="block w-full h-48 rounded-2xl overflow-hidden shadow-inner border border-stone-100 dark:border-stone-800 relative group"
             >
                <iframe 
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  scrolling="no" 
                  marginHeight={0} 
                  marginWidth={0} 
                  src={mapEmbedUrl}
                  className="grayscale dark:invert-[0.9] dark:hue-rotate-180 transition-all opacity-80 group-hover:opacity-100 pointer-events-none"
                />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
             </a>
          </div>

          <div className="space-y-3 pt-4 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2 text-[var(--theme-primary)] dark:text-rose-400">
               <Sparkles size={18} />
               <span className={`font-bold uppercase tracking-wider ${fs.infoText}`}>{t('ai_synthesis')}</span>
            </div>
            <div className={`relative p-5 rounded-2xl border ${isSummarizing ? 'animate-pulse bg-stone-50 dark:bg-stone-800 border-stone-100 dark:border-stone-700' : 'bg-stone-100/50 dark:bg-stone-900/50 border-stone-200/50 dark:border-stone-800'} transition-all`}>
              {isSummarizing ? (
                <div className="flex flex-col items-center justify-center py-4 text-stone-400 gap-2">
                  <Loader2 size={24} className="animate-spin" />
                  <span className={`italic font-medium ${fs.infoText}`}>{t('generating_synthesis')}</span>
                </div>
              ) : aiSummary ? (
                <div className="relative">
                  <div className="absolute -left-1 -top-1 opacity-10"><WineIcon size={40} className="text-[var(--theme-primary)] dark:text-rose-500" /></div>
                  <p className={`text-stone-700 dark:text-stone-300 italic leading-relaxed relative z-10 ${fs.infoText}`}>
                    {aiSummary}
                  </p>
                </div>
              ) : (
                <p className={`text-stone-400 italic text-center ${fs.infoText}`}>{t('no_note')}</p>
              )}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
               <button type="button" onClick={() => setShowDeleteModal(true)} className={`${isHistory ? 'flex-1 h-[56px]' : 'h-[56px] w-[56px] flex-none'} rounded-xl border border-red-200 dark:border-red-900/50 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 transition cursor-pointer flex items-center justify-center gap-2`}>
                 <Trash2 size={20} />
                 {isHistory && <span className="font-bold">{t('delete')}</span>}
              </button>
              {!isHistory && (
                <>
                <button type="button" onClick={() => handleTransferClick(false)} className="flex-none h-[56px] w-[56px] flex items-center justify-center rounded-xl border border-indigo-200 dark:border-indigo-900/50 text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/10 hover:bg-indigo-100 transition cursor-pointer"><Copy size={20} /></button>
                {cellars.length > 1 && (
                  <button type="button" onClick={() => handleTransferClick(true)} className="flex-none h-[56px] w-[56px] flex items-center justify-center rounded-xl border border-orange-200 dark:border-orange-900/50 text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-indigo-900/10 hover:bg-indigo-100 transition cursor-pointer"><Move size={20} /></button>
                )}
                <button type="button" onClick={() => setShowConsumeModal(true)} className={`flex-1 flex items-center justify-center h-[56px] gap-2 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-primary-dark)] text-white font-bold px-6 rounded-xl shadow-lg shadow-[var(--theme-primary)]/20 hover:shadow-xl transition transform active:scale-95 cursor-pointer`}>
                  <Check size={20} /><span>{t('consume_bottle')}</span>
                </button>
                </>
              )}
          </div>
        </div>
      </div>

      {showConsumeModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="relative bg-white dark:bg-stone-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">{t('rate_wine')}</h3>
            <div className="mb-6">
              <label className="block text-xs font-bold text-stone-500 uppercase mb-3">{t('quantity_consumed')}</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setConsumeQty(prev => Math.max(1, prev - 1))} className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center border border-stone-200 active:scale-90 transition-all"><Minus size={20} className="text-stone-600 dark:text-stone-300" /></button>
                <div className="flex-1 h-12 bg-stone-50 dark:bg-stone-900 border border-stone-200 rounded-xl flex items-center justify-center font-bold text-lg text-stone-900 dark:text-white">{consumeQty}</div>
                <button onClick={() => setConsumeQty(prev => Math.min(wine.quantity, prev + 1))} className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center border border-stone-200 active:scale-90 transition-all"><Plus size={20} className="text-stone-600 dark:text-stone-300" /></button>
              </div>
            </div>
            <div className="mb-6"><label className="block text-xs font-bold text-stone-500 uppercase mb-3">Note</label><div className="flex justify-between px-2">{RATINGS.map(r => (<button key={r} onClick={() => setRating(r)} className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold transition-all ${rating === r ? 'bg-[var(--theme-primary)] dark:bg-[var(--theme-primary-dark)] text-white scale-110 shadow-lg' : 'bg-stone-100 dark:bg-stone-800 text-stone-400'}`}>{r}</button>))}</div></div>
            <div className="flex gap-3"><button onClick={() => setShowConsumeModal(false)} className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-600 dark:text-stone-300 font-medium hover:bg-stone-50">{t('cancel')}</button><button onClick={() => onConsume?.(wine as Wine, rating, selectedStrength, consumeQty)} className="flex-1 py-3 rounded-xl bg-[var(--theme-primary)] dark:bg-[var(--theme-primary-dark)] text-white font-bold hover:opacity-90 shadow-lg">{t('confirm')}</button></div>
          </div>
        </div>
      )}

      {transferModal.isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="relative bg-white dark:bg-stone-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl overflow-y-auto no-scrollbar max-h-[90vh]">
            <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-4">{transferModal.isMove ? t('transfer_bottle') : t('duplicate_bottle')}</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-500 uppercase mb-2">{t('switch_cellar')}</label>
                <select 
                  value={targetCellarId} 
                  onChange={(e) => setTargetCellarId(e.target.value)}
                  className={inputClass}
                >
                  {cellars.map((c: Cellar) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase mb-2">{t('target_location')}</label>
                  <select value={targetLocation} onChange={(e) => setTargetLocation(e.target.value)} className={inputClass}>
                    {getCellarShelves(targetCellar).map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase mb-2">{transferModal.isMove ? t('transfer_to') : t('copy_quantity')}</label>
                  <div className="flex items-center gap-3 mt-1">
                    <button onClick={() => setTransferQty(prev => Math.max(1, prev - 1))} className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center border border-stone-200 dark:border-stone-700 active:scale-90 transition-all"><Minus size={20} className="text-stone-600 dark:text-stone-300" /></button>
                    <div className="flex-1 h-12 bg-[var(--theme-bg-soft)] dark:bg-stone-900 border-2 border-[var(--theme-border)] rounded-xl flex items-center justify-center font-bold text-lg text-stone-900 dark:text-white">{transferQty}</div>
                    <button onClick={() => setTransferQty(prev => Math.min(transferModal.isMove ? (wine as Wine).quantity : 100, prev + 1))} className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center border border-stone-200 dark:border-stone-700 active:scale-90 transition-all"><Plus size={20} className="text-stone-600 dark:text-stone-300" /></button>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setTransferModal({ isOpen: false, isMove: false })} className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-600 dark:text-stone-300 font-bold">{t('cancel')}</button>
                <button onClick={confirmTransfer} className="flex-1 py-3 rounded-xl bg-[var(--theme-primary)] dark:bg-[var(--theme-primary-dark)] text-white font-bold shadow-lg">{t('confirm')}</button>
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

function getCellarShelves(cellar: Cellar) {
  const prefix = getTranslation(cellar.settings.language, 'shelf_prefix');
  // Include shelf 0
  const shelves = Array.from({ length: (cellar.settings.shelfCount || 0) + 1 }, (_, i) => `${prefix} ${i}`);
  return [...shelves, getTranslation(cellar.settings.language, 'off_site')];
}
