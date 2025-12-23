
import React, { useState, useEffect, useRef } from 'react';
import { Plus, LayoutGrid, History, Wine as WineIcon, Search, XCircle, ChevronDown, ChevronRight, Calculator, Coins, Hash, PieChart, Settings as SettingsIcon, Info, Clock, Calendar, ArrowRight, X, Trash2 } from 'lucide-react';
import { Wine, HistoryEntry, WineColor, SearchFilters, AppSettings, LOCATION_HORS_CAVE, BackupData, AppFontSize, LocationData } from './types';
import { WineForm } from './components/WineForm';
import { WineDetail } from './components/WineDetail';
import { SearchModal } from './components/SearchModal';
import { StatsView } from './components/StatsView';
import { SettingsModal } from './components/SettingsModal';
import { InfoModal } from './components/InfoModal';
import { LocationManagerModal } from './components/LocationManagerModal';
import { getTranslation, translations } from './translations';
import { COUNTRIES_FR, COUNTRIES_EN, REGIONS_BY_COUNTRY_FR, REGIONS_BY_COUNTRY_EN } from './constants';

type View = 'list' | 'history' | 'add' | 'detail' | 'edit';
type Tab = 'cellar' | 'stats' | 'history';

const DEFAULT_SETTINGS: AppSettings = {
  language: 'fr',
  theme: 'light',
  shelfCount: 4,
  fontSize: 'medium'
};

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('cellar');
  const [view, setView] = useState<View>('list');
  const [selectedWine, setSelectedWine] = useState<Wine | HistoryEntry | null>(null);
  
  // Settings & Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isLocationManagerOpen, setIsLocationManagerOpen] = useState(false);
  
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false);
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [isHistoryQuantityModalOpen, setIsHistoryQuantityModalOpen] = useState(false);
  const [shelfToDelete, setShelfToDelete] = useState<string | null>(null);

  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('my-wine-cellar-settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  // Location Data
  const [locationData, setLocationData] = useState<LocationData>(() => {
    const saved = localStorage.getItem('my-wine-cellar-locations');
    if (saved) return JSON.parse(saved);
    
    // Initial data from constants based on default language
    const isFR = settings.language === 'fr';
    return {
      countries: isFR ? [...COUNTRIES_FR] : [...COUNTRIES_EN],
      regions: isFR ? { ...REGIONS_BY_COUNTRY_FR } : { ...REGIONS_BY_COUNTRY_EN }
    };
  });

  // Data
  const [expandedShelves, setExpandedShelves] = useState<Record<string, boolean>>({});
  const [wines, setWines] = useState<Wine[]>(() => {
    const saved = localStorage.getItem('my-wine-cellar-stock');
    return saved ? JSON.parse(saved) : [];
  });
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const saved = localStorage.getItem('my-wine-cellar-history');
    return saved ? JSON.parse(saved) : [];
  });

  // Translation Helper
  const t = (key: any) => getTranslation(settings.language, key);

  // Persistence
  useEffect(() => {
    localStorage.setItem('my-wine-cellar-stock', JSON.stringify(wines));
  }, [wines]);

  useEffect(() => {
    localStorage.setItem('my-wine-cellar-history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('my-wine-cellar-settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('my-wine-cellar-locations', JSON.stringify(locationData));
  }, [locationData]);

  // Handle Shelf Logic and Language Migration
  const handleUpdateSettings = (newSettings: AppSettings) => {
    let updatedWines = [...wines];

    // Language change logic
    if (newSettings.language !== settings.language) {
        const oldPrefix = translations[settings.language].shelf_prefix;
        const newPrefix = translations[newSettings.language].shelf_prefix;
        const oldOffsite = translations[settings.language].off_site;
        const newOffsite = translations[newSettings.language].off_site;

        updatedWines = updatedWines.map(wine => {
            if (wine.location.startsWith(oldPrefix)) {
                return { ...wine, location: wine.location.replace(oldPrefix, newPrefix) };
            }
            if (wine.location === oldOffsite) {
                return { ...wine, location: newOffsite };
            }
            return wine;
        });

        // Migrate LocationData to new language if they are defaults
        const isNewFR = newSettings.language === 'fr';
        setLocationData({
          countries: isNewFR ? [...COUNTRIES_FR] : [...COUNTRIES_EN],
          regions: isNewFR ? { ...REGIONS_BY_COUNTRY_FR } : { ...REGIONS_BY_COUNTRY_EN }
        });
    }

    if (newSettings.shelfCount < settings.shelfCount) {
        const newPrefix = translations[newSettings.language].shelf_prefix;
        const newOffsite = translations[newSettings.language].off_site;

        updatedWines = updatedWines.map(wine => {
             const match = wine.location.match(/(\d+)/);
             if (match && wine.location.startsWith(newPrefix)) {
                 const shelfNum = parseInt(match[0]);
                 if (shelfNum > newSettings.shelfCount) {
                     return { ...wine, location: newOffsite };
                 }
             }
             return wine;
        });
    }

    if (updatedWines !== wines) {
        setWines(updatedWines);
    }
    setSettings(newSettings);
  };

  const handleExport = async () => {
    const backup: BackupData = {
      wines,
      history,
      settings,
      locations: locationData,
      timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(backup, null, 2);
    const fileName = `wine_cellar_backup_${new Date().toISOString().split('T')[0]}.json`;

    const isNative = (window as any).Capacitor && (window as any).Capacitor.getPlatform() !== 'web';

    if (isNative) {
      try {
        const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
        const { Share } = await import('@capacitor/share');

        const result = await Filesystem.writeFile({
          path: fileName,
          data: dataStr,
          directory: Directory.Cache,
          encoding: Encoding.UTF8
        });

        await Share.share({
          title: 'Ma Cave à Vin - Sauvegarde',
          text: 'Export de ma cave à vin au format JSON.',
          url: result.uri,
          dialogTitle: 'Exporter les données',
        });
      } catch (err) {
        console.error('Capacitor export error:', err);
        alert('Erreur lors de l\'exportation native. Tentative via navigateur...');
        downloadWeb(dataStr, fileName);
      }
    } else {
      downloadWeb(dataStr, fileName);
    }
  };

  const downloadWeb = (data: string, name: string) => {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", name);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    URL.revokeObjectURL(url);
  };

  const handleImport = (data: BackupData) => {
    setWines(data.wines);
    setHistory(data.history);
    setSettings(data.settings);
    if (data.locations) setLocationData(data.locations);
    setActiveTab('cellar');
    setView('list');
    setIsSettingsOpen(false);
    alert(t('import_success'));
  };

  const getAvailableLocations = (): string[] => {
    const prefix = t('shelf_prefix');
    const shelves = Array.from({ length: settings.shelfCount }, (_, i) => `${prefix} ${i + 1}`);
    return [...shelves, t('off_site')];
  };

  const availableLocations = getAvailableLocations();

  const getFontSizeClasses = (size: AppFontSize) => {
    switch(size) {
      case 'small': return { title: 'text-sm', sub: 'text-[10px]', badgeLabel: 'text-[9px]', badgeValue: 'text-xs', shelfTitle: 'text-base', shelfCount: 'text-sm', shelfCost: 'text-xs', shelfColorCount: 'text-sm', statsValue: 'text-base' };
      case 'large': return { title: 'text-lg', sub: 'text-sm', badgeLabel: 'text-[11px]', badgeValue: 'text-base', shelfTitle: 'text-xl', shelfCount: 'text-xl', shelfCost: 'text-lg', shelfColorCount: 'text-xl', statsValue: 'text-2xl' };
      case 'medium':
      default: return { title: 'text-base', sub: 'text-xs', badgeLabel: 'text-[10px]', badgeValue: 'text-sm', shelfTitle: 'text-lg', shelfCount: 'text-lg', shelfCost: 'text-base', shelfColorCount: 'text-lg', statsValue: 'text-xl' };
    }
  };

  const fontClasses = getFontSizeClasses(settings.fontSize || 'medium');

  const filterList = <T extends Wine>(list: T[], isHistoryList: boolean = false): T[] => {
    const hasFilters = Object.keys(searchFilters).length > 0;
    if (!hasFilters) return list;

    return list.filter(item => {
      if (searchFilters.name && !item.name.toLowerCase().includes(searchFilters.name.toLowerCase())) return false;
      if (searchFilters.appellation && !item.appellation.toLowerCase().includes(searchFilters.appellation.toLowerCase())) return false;
      if (searchFilters.region && item.region !== searchFilters.region) return false;
      if (searchFilters.country && item.country !== searchFilters.country) return false;
      if (searchFilters.color && item.color !== searchFilters.color) return false;
      if (searchFilters.year !== undefined && item.year !== searchFilters.year) return false;
      if (searchFilters.origin && !item.origin.toLowerCase().includes(searchFilters.origin.toLowerCase())) return false;
      if (searchFilters.strength !== undefined && item.strength !== searchFilters.strength) return false;
      if (!isHistoryList) {
        if (searchFilters.recommendedYear !== undefined && item.recommendedYear !== searchFilters.recommendedYear) return false;
        if (searchFilters.agingPotential && item.agingPotential !== searchFilters.agingPotential) return false;
      }
      return true;
    });
  };

  const filteredWines = filterList<Wine>(wines, false);
  const filteredHistory = filterList<HistoryEntry>(history, true);
  const isFiltering = Object.keys(searchFilters).length > 0;

  const handleAddWine = (wineData: Omit<Wine, 'id'>) => {
    const newWine: Wine = { ...wineData, id: Date.now().toString() };
    setWines(prev => [...prev, newWine]);
    setView('list');
    setActiveTab('cellar');
  };

  const handleEditWine = (wineData: Omit<Wine, 'id'>) => {
    if (selectedWine && 'id' in selectedWine) {
        if (activeTab === 'history') {
            setHistory(prev => prev.map(h => h.id === selectedWine.id ? { ...h, ...wineData } : h));
            setSelectedWine(prev => prev ? { ...prev, ...wineData } : null);
        } else {
            const updatedWine = { ...wineData, id: selectedWine.id } as Wine;
            setWines(prev => prev.map(w => w.id === selectedWine.id ? updatedWine : w));
            setSelectedWine(updatedWine);
        }
        setView('detail');
    }
  };

  const handleUpdateWineImage = (id: string, image: string, isHistory: boolean) => {
    if (isHistory) setHistory(prev => prev.map(h => h.id === id ? { ...h, image } : h));
    else setWines(prev => prev.map(w => w.id === id ? { ...w, image } : w));
    if (selectedWine && selectedWine.id === id) setSelectedWine(prev => prev ? { ...prev, image } : null);
  };

  const handleDuplicateWine = (sourceWine: Wine, quantity: number, location: string) => {
      const { id, ...wineProps } = sourceWine;
      const newWine: Wine = { ...wineProps as Wine, id: Date.now().toString(), quantity, location, purchaseDate: sourceWine.purchaseDate || new Date().toISOString() };
      setWines(prev => [...prev, newWine]);
      setActiveTab('cellar');
      setView('list');
  };

  const handleDeleteWine = (id: string) => { setWines(prev => prev.filter(w => w.id !== id)); setView('list'); };
  const handleDeleteHistory = (id: string) => { setHistory(prev => prev.filter(h => h.id !== id)); setView('list'); };

  const handleConsumeWine = (wine: Wine, rating: number, strength: number) => {
    const existingHistoryIndex = history.findIndex(h => h.name === wine.name && h.year === wine.year && h.appellation === wine.appellation);
    let newHistory;
    if (existingHistoryIndex >= 0) {
        newHistory = [...history];
        newHistory[existingHistoryIndex] = { ...newHistory[existingHistoryIndex], quantity: newHistory[existingHistoryIndex].quantity + 1, consumptionRating: rating, strength, consumedDate: new Date().toISOString() };
    } else {
        const historyEntry: HistoryEntry = { ...wine, strength, consumedDate: new Date().toISOString(), consumptionRating: rating, quantity: 1 };
        newHistory = [...history, historyEntry];
    }
    setHistory(newHistory);
    if (wine.quantity > 1) { setWines(prev => prev.map(w => w.id === wine.id ? { ...w, quantity: w.quantity - 1 } : w)); setView('list'); }
    else { setWines(prev => prev.filter(w => w.id !== wine.id)); setView('list'); }
  };

  const toggleShelf = (shelf: string) => setExpandedShelves(prev => ({ ...prev, [shelf]: !prev[shelf] }));

  const handleConfirmDeleteShelf = (shelfName: string) => {
    const offsiteLabel = t('off_site');
    setWines(prev => prev.map(w => w.location === shelfName ? { ...w, location: offsiteLabel } : w));
    setShelfToDelete(null);
  };

  const getColorTheme = (color: WineColor) => {
    switch (color) {
      case WineColor.ROUGE: return 'border-l-rose-900 bg-rose-200/60 hover:bg-rose-300/60 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:border-l-rose-700';
      case WineColor.BLANC: return 'border-l-yellow-500 bg-yellow-100/50 hover:bg-yellow-200/50 dark:bg-yellow-900/40 dark:hover:bg-yellow-900/60 dark:border-l-yellow-400';
      case WineColor.ROSE: return 'border-l-pink-500 bg-pink-50/60 hover:bg-pink-100/60 dark:bg-pink-900/20 dark:hover:bg-pink-900/40 dark:border-l-pink-400';
      default: return 'border-l-gray-300 bg-white dark:bg-stone-800';
    }
  };

  const getQuantityBadgeStyle = (color: WineColor) => {
    switch (color) {
        case WineColor.ROUGE: return 'bg-rose-200/80 dark:bg-rose-900/60 text-rose-950 dark:text-rose-100 border border-rose-300 dark:border-rose-800';
        case WineColor.BLANC: return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-100 border border-yellow-200 dark:border-yellow-800';
        case WineColor.ROSE: return 'bg-pink-100 dark:bg-pink-900/40 text-pink-900 dark:text-pink-100 border border-pink-200 dark:border-pink-800';
        default: return 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700';
    }
  };

  const getConsumptionStatusColor = (wine: Wine) => {
      const currentYear = new Date().getFullYear();
      if (currentYear > wine.recommendedYear) return 'bg-red-500';
      if (currentYear === wine.recommendedYear) return 'bg-orange-500';
      return 'bg-green-500';
  };

  const renderStatsBar = (items: Wine[]) => {
    const totalBottles = items.reduce((acc, item) => acc + item.quantity, 0);
    const totalCost = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const avgPrice = totalBottles > 0 ? totalCost / totalBottles : 0;
    const isCellar = activeTab === 'cellar';
    const isHistory = activeTab === 'history';
    const isStats = activeTab === 'stats';
    return (
      <div className="grid grid-cols-3 gap-1.5 mb-4">
        <button disabled={isStats} onClick={() => isCellar ? setIsQuantityModalOpen(true) : setIsHistoryQuantityModalOpen(true)} className={`bg-white dark:bg-stone-800 p-2 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 flex flex-col items-center justify-center transition-all ${!isStats ? 'active:scale-95 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-700' : ''}`}>
            <div className="flex items-center gap-1 text-stone-400 dark:text-stone-500 mb-0.5"><Hash size={10}/><span className="text-[9px] uppercase font-bold tracking-wide">{isHistory ? t('consumed') : t('bottles')}</span></div>
            <p className={`font-bold text-stone-800 dark:text-stone-100 leading-tight ${fontClasses.statsValue}`}>{totalBottles}</p>
        </button>
        <button disabled={!isCellar} onClick={() => setIsCostModalOpen(true)} className={`bg-white dark:bg-stone-800 p-2 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 flex flex-col items-center justify-center transition-all ${isCellar ? 'active:scale-95 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-700' : ''}`}>
             <div className="flex items-center gap-1 text-stone-400 dark:text-stone-500 mb-0.5"><Coins size={10}/><span className="text-[9px] uppercase font-bold tracking-wide">{t('total_cost')}</span></div>
            <p className={`font-bold text-stone-800 dark:text-stone-100 leading-tight ${fontClasses.statsValue}`}>{totalCost.toLocaleString(settings.language, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</p>
        </button>
        <div className="bg-white dark:bg-stone-800 p-2 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 flex flex-col items-center justify-center transition-colors">
            <div className="flex items-center gap-1 text-stone-400 dark:text-stone-500 mb-0.5"><Calculator size={10}/><span className="text-[9px] uppercase font-bold tracking-wide">{t('avg_price')}</span></div>
            <p className={`font-bold text-stone-800 dark:text-stone-100 leading-tight ${fontClasses.statsValue}`}>{avgPrice.toLocaleString(settings.language, { style: 'currency', currency: 'EUR', maximumFractionDigits: 1 })}</p>
        </div>
      </div>
    );
  };

  const renderFloatingList = (isOpen: boolean, onClose: () => void, title: string, items: Wine[] | HistoryEntry[], sortType: 'consumption' | 'cost' | 'most_consumed') => {
    if (!isOpen) return null;
    const sortedItems = [...items].sort((a, b) => {
        if (sortType === 'consumption') return a.recommendedYear - b.recommendedYear;
        else if (sortType === 'most_consumed') return b.quantity - a.quantity;
        else return (b.price * b.quantity) - (a.price * a.quantity);
    });
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-stone-900 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-stone-100 dark:border-stone-800 animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50/50 dark:bg-stone-800/50">
                    <h2 className="font-serif font-bold text-lg text-rose-900 dark:text-rose-100">{title}</h2>
                    <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-full bg-white dark:bg-stone-800 shadow-sm"><X size={20}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 no-scrollbar">
                    {sortedItems.map(wine => {
                        const yearsInCellar = Math.max(0, (new Date().getTime() - new Date(wine.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
                        const age = new Date().getFullYear() - wine.year;
                        const isHistoryEntry = 'consumedDate' in wine;
                        return (
                            <div key={wine.id} onClick={() => { setSelectedWine(wine); setView('detail'); onClose(); }} className={`flex gap-3 items-center p-3 rounded-xl cursor-pointer transition-all border-l-4 shadow-sm ${getColorTheme(wine.color)}`}>
                                <div className="w-14 h-14 rounded-full bg-white dark:bg-stone-800 flex-shrink-0 overflow-hidden border border-white dark:border-stone-700 shadow-sm relative">{wine.image ? <img src={wine.image} className="w-full h-full object-cover" alt="" /> : <WineIcon className="w-6 h-6 m-auto mt-4 text-stone-300 dark:text-stone-600"/>}</div>
                                <div className="flex-1 min-w-0"><p className="font-bold text-stone-900 dark:text-white truncate leading-tight">{wine.name}</p><div className="flex items-center gap-1.5 mt-0.5 flex-wrap"><span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase">{wine.year} • {age} {t('years_old')}</span>{!isHistoryEntry && <><div className="w-1 h-1 rounded-full bg-stone-300 dark:bg-stone-700"></div><span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase">{wine.location}</span></>}</div><div className="flex items-center gap-3 mt-1.5">{sortType === 'consumption' ? <div className="flex items-center gap-1 text-rose-800 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded border border-rose-100 dark:border-rose-900/30"><Calendar size={10} /><span className="text-[10px] font-bold">{t('recommended_year')}: {wine.recommendedYear}</span></div> : sortType === 'most_consumed' && isHistoryEntry ? <div className="flex items-center gap-1 text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded border border-amber-100 dark:border-amber-900/30"><History size={10} /><span className="text-[10px] font-bold">{t('consumed_on')} {new Date((wine as HistoryEntry).consumedDate).toLocaleDateString()}</span></div> : <div className="flex items-center gap-1 text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/30"><Coins size={10} /><span className="text-[10px] font-bold">{(wine.price * wine.quantity).toLocaleString(settings.language, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</span></div>}{sortType !== 'most_consumed' && <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400"><Clock size={10} /><span className="text-[10px] font-medium">{yearsInCellar} {t('years_old')} {t('time_in_cellar').toLowerCase()}</span></div>}{sortType === 'most_consumed' && <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400"><Hash size={10} /><span className="text-[10px] font-bold">{t('total_drunk')}: {wine.quantity}</span></div>}</div></div><ArrowRight size={16} className="text-stone-300 dark:text-stone-600 flex-shrink-0" /></div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
  };

  const SliderConfirm = ({ onConfirm, onCancel, message }: { onConfirm: () => void, onCancel: () => void, message: string }) => {
    const [sliderValue, setSliderValue] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => { const val = parseInt(e.target.value); setSliderValue(val); if (val >= 95) onConfirm(); };
    const handleRelease = () => { if (sliderValue < 95) setSliderValue(0); };
    const trackWidth = containerRef.current ? containerRef.current.offsetWidth - 48 : 280;
    return (
        <div className="space-y-6 pt-2" ref={containerRef}><p className="text-stone-600 dark:text-stone-300 text-sm leading-relaxed">{message}</p><div className="relative h-14 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center px-2 border border-stone-200 dark:border-stone-700 overflow-hidden shadow-inner"><div className="absolute left-0 top-0 h-full bg-rose-900/20 dark:bg-rose-700/20 transition-all duration-75" style={{ width: `${sliderValue}%` }} /><div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="text-stone-400 dark:text-stone-500 text-xs font-bold uppercase tracking-widest">{t('swipe_to_confirm')}</span></div><input type="range" min="0" max="100" value={sliderValue} onInput={handleInput} onMouseUp={handleRelease} onTouchEnd={handleRelease} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" /><div className="w-10 h-10 bg-rose-900 dark:bg-rose-700 rounded-xl flex items-center justify-center text-white shadow-lg pointer-events-none transition-transform duration-75" style={{ transform: `translateX(${(sliderValue / 100) * trackWidth}px)` }}><ArrowRight size={24} /></div></div><button onClick={onCancel} className="w-full py-2 text-stone-400 dark:text-stone-500 font-bold hover:text-stone-600 dark:hover:text-stone-300 transition">{t('cancel')}</button></div>
    );
  };

  const renderContent = () => {
    if (view === 'add') return <WineForm onSave={handleAddWine} onCancel={() => setView('list')} availableLocations={availableLocations} locationData={locationData} onOpenLocationManager={() => setIsLocationManagerOpen(true)} language={settings.language} />;
    if (view === 'edit' && selectedWine) return <WineForm initialData={selectedWine} onSave={handleEditWine} onCancel={() => setView('detail')} availableLocations={availableLocations} locationData={locationData} onOpenLocationManager={() => setIsLocationManagerOpen(true)} language={settings.language} isHistoryMode={activeTab === 'history'} />;
    if (view === 'detail' && selectedWine) return <WineDetail wine={selectedWine} onBack={() => setView('list')} onConsume={activeTab === 'history' ? undefined : handleConsumeWine} onDelete={activeTab === 'history' ? handleDeleteHistory : handleDeleteWine} onEdit={() => setView('edit')} onDuplicate={handleDuplicateWine} onUpdateImage={(img) => handleUpdateWineImage(selectedWine.id, img, activeTab === 'history')} availableLocations={availableLocations} isHistory={activeTab === 'history'} language={settings.language} fontSize={settings.fontSize} />;
    if (activeTab === 'stats') return <StatsView wines={wines} history={history} language={settings.language} theme={settings.theme} />;
    if (activeTab === 'cellar') {
      return (
        <div className="pb-24 px-2 py-4 space-y-3"><div className="flex justify-between items-center mb-1 px-1"><h1 className="text-2xl font-serif font-bold text-rose-950 dark:text-rose-100">{t('app_title')}</h1><div className="flex gap-2"><button onClick={() => setIsSearchOpen(true)} className={`p-2 rounded-full transition-all ${isFiltering ? 'bg-rose-100 dark:bg-rose-900 text-rose-900 dark:text-rose-100 shadow-sm' : 'bg-white dark:bg-stone-800 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 shadow-sm'}`}><Search size={22} /></button><button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full bg-white dark:bg-stone-800 text-stone-400 dark:text-stone-500 shadow-sm"><SettingsIcon size={22} /></button><button onClick={() => setIsInfoOpen(true)} className="p-2 rounded-full bg-white dark:bg-stone-800 text-stone-400 dark:text-stone-500 shadow-sm"><Info size={22} /></button></div></div>{renderStatsBar(filteredWines)}{filteredWines.length === 0 && <div className="text-center py-20 text-stone-400 dark:text-stone-600 flex flex-col items-center"><div className="w-20 h-20 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mb-4"><WineIcon size={40} className="opacity-40"/></div><p>{t('empty_cellar')}</p></div>}{availableLocations.map(shelfName => { const shelfWines = filteredWines.filter(w => w.location === shelfName); if (shelfWines.length === 0) return null; const isExpanded = expandedShelves[shelfName] || false; const shelfQty = shelfWines.reduce((acc, w) => acc + w.quantity, 0); const shelfTotalCost = shelfWines.reduce((acc, w) => acc + (w.price * w.quantity), 0); const shelfColorCounts = shelfWines.reduce((acc, w) => { acc[w.color] = (acc[w.color] || 0) + w.quantity; return acc; }, { [WineColor.ROUGE]: 0, [WineColor.BLANC]: 0, [WineColor.ROSE]: 0 } as Record<WineColor, number>); return ( <div key={shelfName} className="bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-100/80 dark:border-stone-800 overflow-hidden"><div className={`w-full flex justify-between items-center ${isExpanded ? 'bg-stone-50 dark:bg-stone-800 border-b border-stone-100 dark:border-stone-800' : ''}`}><button onClick={() => toggleShelf(shelfName)} className="flex-1 p-4 flex items-center gap-2.5 text-left"><div className="text-stone-400">{isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</div><h2 className={`font-bold text-gray-800 dark:text-gray-100 ${fontClasses.shelfTitle}`}>{shelfName}</h2></button><div className="flex items-center gap-2 px-3"><div className="flex items-center gap-3 mr-1">{shelfColorCounts[WineColor.ROUGE] > 0 && <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-rose-950 dark:bg-rose-600 shadow-sm"></div><span className={`font-bold text-stone-600 dark:text-stone-300 ${fontClasses.shelfColorCount}`}>{shelfColorCounts[WineColor.ROUGE]}</span></div>}{shelfColorCounts[WineColor.BLANC] > 0 && <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-400 dark:bg-yellow-500 shadow-sm"></div><span className={`font-bold text-stone-600 dark:text-stone-300 ${fontClasses.shelfColorCount}`}>{shelfColorCounts[WineColor.BLANC]}</span></div>}{shelfColorCounts[WineColor.ROSE] > 0 && <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-pink-400 dark:bg-pink-500 shadow-sm"></div><span className={`font-bold text-stone-600 dark:text-stone-300 ${fontClasses.shelfColorCount}`}>{shelfColorCounts[WineColor.ROSE]}</span></div>}</div><span className={`text-stone-400 dark:text-stone-500 font-bold uppercase transition-all ${fontClasses.shelfCost}`}>{shelfTotalCost.toLocaleString(settings.language, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</span><span className={`bg-gray-100 dark:bg-stone-800 text-gray-600 dark:text-stone-300 font-bold px-2 py-0.5 rounded-full border border-gray-200 dark:border-stone-700 transition-all ${fontClasses.shelfCount}`}>{shelfQty}</span><button onClick={(e) => { e.stopPropagation(); setShelfToDelete(shelfName); }} className="p-1.5 text-stone-300 hover:text-red-500 dark:hover:text-red-400 transition"><Trash2 size={18} /></button></div></div>{isExpanded && <div className="p-2 space-y-2">{shelfWines.map(wine => ( <div key={wine.id} onClick={() => { setSelectedWine(wine); setView('detail'); }} className={`flex gap-2.5 items-center p-2 rounded-lg cursor-pointer transition-all shadow-sm border-l-4 ${getColorTheme(wine.color)}`}><div className="w-12 h-12 rounded-full bg-white dark:bg-stone-800 flex-shrink-0 overflow-hidden border border-white dark:border-stone-700 shadow-sm relative">{wine.image ? <img src={wine.image} className="w-full h-full object-cover" alt="" /> : <WineIcon className="w-5 h-5 m-auto mt-3.5 text-stone-300 dark:text-stone-600"/>}</div><div className="flex-1 min-w-0"><p className={`font-bold text-gray-800 dark:text-gray-100 truncate ${fontClasses.title} leading-tight`}>{wine.name}</p><div className="flex items-center gap-1.5 mt-0.5"><p className={`text-gray-500 dark:text-gray-400 truncate ${fontClasses.sub}`}>{wine.region} - {wine.year}</p><div className={`w-1.5 h-1.5 rounded-full ${getConsumptionStatusColor(wine)} flex-shrink-0`}></div></div></div><div className={`flex flex-col items-center justify-center w-9 h-9 rounded shadow-sm ${getQuantityBadgeStyle(wine.color)} flex-shrink-0`}><span className={`uppercase font-bold opacity-60 leading-none ${fontClasses.badgeLabel}`}>{t('qty')}</span><span className={`font-bold leading-none mt-0.5 ${fontClasses.badgeValue}`}>{wine.quantity}</span></div></div> ))}</div>}</div> ); })}</div>
      );
    }
    if (activeTab === 'history') {
      return (
        <div className="pb-24 px-2 py-4"><div className="flex justify-between items-center mb-4 px-1"><h1 className="text-2xl font-serif font-bold text-stone-800 dark:text-stone-100">{t('history')}</h1><div className="flex gap-2"><button onClick={() => setIsSearchOpen(true)} className={`p-2 rounded-full transition-all ${isFiltering ? 'bg-rose-100 dark:bg-rose-900 text-rose-900 dark:text-rose-100 shadow-sm' : 'bg-white dark:bg-stone-800 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 shadow-sm'}`}><Search size={22} /></button><button onClick={() => setIsInfoOpen(true)} className="p-2 rounded-full bg-white dark:bg-stone-800 text-stone-400 dark:text-stone-500 shadow-sm"><Info size={22} /></button></div></div>{renderStatsBar(filteredHistory)}{filteredHistory.length === 0 ? <div className="text-center py-20 text-stone-400 flex flex-col items-center"><History size={40} className="opacity-40 mb-4"/><p>{t('empty_history')}</p></div> : ( <div className="space-y-3">{filteredHistory.map((entry, idx) => ( <div key={idx} onClick={() => { setSelectedWine(entry); setView('detail'); }} className={`flex gap-3 p-2.5 rounded-xl cursor-pointer shadow-sm border-l-4 ${getColorTheme(entry.color)}`}><div className="w-12 h-12 rounded-lg bg-white dark:bg-stone-800 flex-shrink-0 overflow-hidden border border-stone-200 dark:border-stone-700">{entry.image ? <img src={entry.image} className="w-full h-full object-cover" alt="" /> : <WineIcon className="w-full h-full p-3 text-stone-300"/>}</div><div className="flex-1 min-w-0"><div className="flex justify-between items-start"><h3 className={`font-bold text-stone-800 dark:text-stone-100 truncate pr-2 ${fontClasses.title} leading-tight`}>{entry.name}</h3><div className="flex items-center gap-0.5 text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1 py-0.5 rounded border border-amber-100 dark:border-amber-900/30 shadow-sm flex-shrink-0"><span className={`font-bold text-amber-600 dark:text-amber-400 ${fontClasses.badgeValue}`}>{entry.consumptionRating}</span><span className="text-amber-500 text-[9px]">★</span></div></div><p className={`text-stone-600 dark:text-stone-400 font-medium ${fontClasses.sub} truncate`}>{entry.appellation} - {entry.year}</p><div className="flex items-center justify-between mt-1"><p className={`text-stone-400 dark:text-stone-500 ${fontClasses.sub}`}>{t('consumed_on')} {new Date(entry.consumedDate).toLocaleDateString()}</p><div className={`bg-white/50 dark:bg-stone-800 px-1.5 py-0.5 rounded text-stone-600 dark:text-stone-400 font-semibold border border-stone-200/50 dark:border-stone-700 ${fontClasses.badgeLabel}`}>{t('total_drunk')}: {entry.quantity}</div></div></div></div> ))}</div> )}</div>
      );
    }
  };

  return (
    <div className={settings.theme === 'dark' ? 'dark' : ''}>
      <div className="bg-stone-200 dark:bg-stone-950 h-screen w-full flex justify-center overflow-hidden">
        <main className="w-full lg:max-w-4xl h-full bg-stone-100 dark:bg-black shadow-2xl relative flex flex-col transition-colors duration-300">
          <div className="flex-1 overflow-y-auto no-scrollbar relative">{renderContent()}</div>
          {view === 'list' && activeTab === 'cellar' && ( <button onClick={() => setView('add')} className="absolute bottom-24 right-6 bg-rose-900 dark:bg-rose-700 text-white p-4 rounded-full shadow-lg shadow-rose-900/30 hover:scale-105 active:scale-95 z-30"><Plus size={28} /></button> )}
          {view === 'list' && ( <div className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 z-40 safe-area-bottom"><div className="flex justify-around items-center h-20 pb-2"><button onClick={() => { setActiveTab('cellar'); setView('list'); }} className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'cellar' ? 'text-rose-900 dark:text-rose-400' : 'text-stone-400'}`}><LayoutGrid size={24} /><span className="text-xs font-semibold">{t('cellar')}</span></button><button onClick={() => { setActiveTab('stats'); setView('list'); }} className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'stats' ? 'text-rose-900 dark:text-rose-400' : 'text-stone-400'}`}><PieChart size={24} /><span className="text-xs font-semibold">{t('stats')}</span></button><button onClick={() => { setActiveTab('history'); setView('list'); }} className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'history' ? 'text-rose-900 dark:text-rose-400' : 'text-stone-400'}`}><History size={24} /><span className="text-xs font-semibold">{t('history')}</span></button></div></div> )}
        </main>
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onSearch={setSearchFilters} currentFilters={searchFilters} onReset={() => setSearchFilters({})} locationData={locationData} language={settings.language} isHistoryMode={activeTab === 'history'} />
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} onUpdateSettings={handleUpdateSettings} onExport={handleExport} onImport={handleImport} />
        <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
        <LocationManagerModal isOpen={isLocationManagerOpen} onClose={() => setIsLocationManagerOpen(false)} language={settings.language} locationData={locationData} onUpdateLocationData={setLocationData} />
        
        {renderFloatingList(isQuantityModalOpen, () => setIsQuantityModalOpen(false), t('priority_consumption'), wines, 'consumption')}
        {renderFloatingList(isCostModalOpen, () => setIsCostModalOpen(false), t('top_value_wines'), wines, 'cost')}
        {renderFloatingList(isHistoryQuantityModalOpen, () => setIsHistoryQuantityModalOpen(false), t('most_consumed_wines'), history, 'most_consumed')}
        
        {shelfToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShelfToDelete(null)} />
                <div className="relative bg-white dark:bg-stone-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl transition-colors animate-in zoom-in-95 duration-200">
                    <h3 className="text-xl font-serif font-bold text-rose-950 dark:text-rose-100 mb-2">{t('shelf_delete_title')}</h3>
                    <SliderConfirm message={t('shelf_delete_msg')} onConfirm={() => handleConfirmDeleteShelf(shelfToDelete)} onCancel={() => setShelfToDelete(null)} />
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

export default App;
