
import React, { useState, useEffect, useRef } from 'react';
import { Plus, LayoutGrid, History, Wine as WineIcon, Search, XCircle, ChevronDown, ChevronRight, Calculator, Coins, Hash, PieChart, Settings as SettingsIcon, Info, Clock, Calendar, ArrowRight, X, Trash2, Maximize2, ChevronsRight, Warehouse, Pencil, Camera, RefreshCw, Star } from 'lucide-react';
import { Wine, HistoryEntry, WineColor, SearchFilters, AppSettings, LOCATION_HORS_CAVE, BackupData, AppFontSize, LocationData, Cellar } from './types';
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

const DEFAULT_CELLAR: Omit<Cellar, 'id'> = {
  name: 'Ma cave',
  image: null,
  wines: [],
  history: [],
  settings: DEFAULT_SETTINGS
};

// --- COMPOSANTS INTERNES ---

const SwipeSlider: React.FC<{ 
  onConfirm: () => void, 
  label: string,
  fontSizeClass: string,
  disabled?: boolean
}> = ({ onConfirm, label, fontSizeClass, disabled }) => {
  const [position, setPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    setIsDragging(true);
    startXRef.current = e.clientX - (position * (containerRef.current?.clientWidth || 0) / 100);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current || disabled) return;
    const containerWidth = containerRef.current.clientWidth;
    const handleWidth = 56;
    const maxTravel = containerWidth - handleWidth - 8;
    let newX = e.clientX - startXRef.current;
    newX = Math.max(0, Math.min(newX, maxTravel));
    const newPercentage = (newX / maxTravel) * 100;
    setPosition(newPercentage);
    if (newPercentage >= 98) {
      setIsDragging(false);
      onConfirm();
    }
  };

  const handlePointerUp = () => {
    if (position < 98) {
      setIsDragging(false);
      setPosition(0);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-16 rounded-2xl overflow-hidden border shadow-inner touch-none transition-opacity ${disabled ? 'opacity-30' : 'opacity-100'} ${disabled ? 'bg-stone-100 dark:bg-stone-800' : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700'}`}
    >
      <div className="absolute top-0 left-0 h-full bg-red-900/10 dark:bg-red-900/30 transition-all duration-75" style={{ width: `${position}%` }} />
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity ${position > 50 ? 'opacity-0' : 'opacity-100'}`}>
        <span className={`font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest flex items-center gap-2 select-none ${fontSizeClass}`}>
          {label} <ChevronsRight size={18} className="animate-pulse" />
        </span>
      </div>
      <div 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`absolute top-1 bottom-1 w-14 bg-red-800 dark:bg-red-700 rounded-xl shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing z-20 transition-transform ${!isDragging ? 'duration-300 ease-out' : 'duration-0'}`}
        style={{ left: '4px', transform: `translateX(${position * (containerRef.current ? (containerRef.current.clientWidth - 64) : 0) / 100}px)` }}
      >
        <ChevronsRight size={24} className="text-white pointer-events-none" />
      </div>
    </div>
  );
};

// --- APPLICATION PRINCIPALE ---

function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<Tab>('cellar');
  const [view, setView] = useState<View>('list');
  const [selectedWine, setSelectedWine] = useState<Wine | HistoryEntry | null>(null);
  const [largeImage, setLargeImage] = useState<string | null>(null);
  
  // Modaux
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isLocationManagerOpen, setIsLocationManagerOpen] = useState(false);
  const [isCellarManagerOpen, setIsCellarManagerOpen] = useState(false);
  const [isCellarSelectorOpen, setIsCellarSelectorOpen] = useState(false);
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false);
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [isHistoryQuantityModalOpen, setIsHistoryQuantityModalOpen] = useState(false);
  const [shelfToDelete, setShelfToDelete] = useState<string | null>(null);

  // Filtres
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});

  // --- GESTION MULTI-CAVES ---

  const [cellars, setCellars] = useState<Cellar[]>(() => {
    const saved = localStorage.getItem('my-wine-cellars-v2');
    if (saved) return JSON.parse(saved);

    // Migration v1 -> v2
    const oldWines = localStorage.getItem('my-wine-cellar-stock');
    const oldHistory = localStorage.getItem('my-wine-cellar-history');
    const oldSettings = localStorage.getItem('my-wine-cellar-settings');
    
    const initialCellar: Cellar = {
      id: 'default',
      name: 'Ma cave',
      image: null,
      wines: oldWines ? JSON.parse(oldWines) : [],
      history: oldHistory ? JSON.parse(oldHistory) : [],
      settings: oldSettings ? JSON.parse(oldSettings) : DEFAULT_SETTINGS
    };
    return [initialCellar];
  });

  const [activeCellarId, setActiveCellarId] = useState<string>(() => {
    return localStorage.getItem('active-cellar-id') || cellars[0]?.id || 'default';
  });

  const activeCellar = cellars.find(c => c.id === activeCellarId) || cellars[0];
  const settings = activeCellar.settings;
  const wines = activeCellar.wines;
  const history = activeCellar.history;

  // Sync LocalStorage
  useEffect(() => {
    localStorage.setItem('my-wine-cellars-v2', JSON.stringify(cellars));
    localStorage.setItem('active-cellar-id', activeCellarId);
  }, [cellars, activeCellarId]);

  const updateActiveCellar = (updates: Partial<Cellar>) => {
    setCellars(prev => prev.map(c => c.id === activeCellarId ? { ...c, ...updates } : c));
  };

  const handleAddCellar = (name: string, image: string | null) => {
    const newCellar: Cellar = {
      id: Date.now().toString(),
      name,
      image,
      wines: [],
      history: [],
      settings: { ...DEFAULT_SETTINGS, language: settings.language, theme: settings.theme }
    };
    setCellars(prev => [...prev, newCellar]);
    setActiveCellarId(newCellar.id);
  };

  const handleDeleteCellar = (id: string) => {
    if (cellars.length <= 1) return;
    const newCellars = cellars.filter(c => c.id !== id);
    setCellars(newCellars);
    if (activeCellarId === id) setActiveCellarId(newCellars[0].id);
  };

  // --- AUTRES ETATS ---

  const [locationData, setLocationData] = useState<LocationData>(() => {
    try {
      const saved = localStorage.getItem('my-wine-cellar-locations');
      if (saved) return JSON.parse(saved);
    } catch {}
    const isFR = settings.language === 'fr';
    return {
      countries: isFR ? [...COUNTRIES_FR] : [...COUNTRIES_EN],
      regions: isFR ? { ...REGIONS_BY_COUNTRY_FR } : { ...REGIONS_BY_COUNTRY_EN }
    };
  });

  const [expandedShelves, setExpandedShelves] = useState<Record<string, boolean>>({});

  const t = (key: any) => getTranslation(settings.language, key);

  useEffect(() => {
    localStorage.setItem('my-wine-cellar-locations', JSON.stringify(locationData));
  }, [locationData]);

  // --- HANDLERS ---

  const handleUpdateSettings = (newSettings: AppSettings) => {
    let updatedWines = [...wines];
    if (newSettings.language !== settings.language) {
        const oldPrefix = translations[settings.language].shelf_prefix;
        const newPrefix = translations[newSettings.language].shelf_prefix;
        const oldOffsite = translations[settings.language].off_site;
        const newOffsite = translations[newSettings.language].off_site;
        updatedWines = updatedWines.map(wine => {
            if (wine.location.startsWith(oldPrefix)) return { ...wine, location: wine.location.replace(oldPrefix, newPrefix) };
            if (wine.location === oldOffsite) return { ...wine, location: newOffsite };
            return wine;
        });
        const isNewFR = newSettings.language === 'fr';
        setLocationData({
          countries: isNewFR ? [...COUNTRIES_FR] : [...COUNTRIES_EN],
          regions: isNewFR ? { ...REGIONS_BY_COUNTRY_FR } : { ...REGIONS_BY_COUNTRY_EN }
        });
    }
    updateActiveCellar({ settings: newSettings, wines: updatedWines });
  };

  const handleExport = async () => {
    const backup: BackupData = { 
      cellars,
      activeCellarId,
      locations: locationData,
      timestamp: new Date().toISOString() 
    };
    const dataStr = JSON.stringify(backup, null, 2);
    const fileName = `wine_cellars_backup_${new Date().toISOString().split('T')[0]}.json`;
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (data: BackupData) => {
    if (data.cellars) {
      setCellars(data.cellars);
      setActiveCellarId(data.activeCellarId);
      if (data.locations) setLocationData(data.locations);
      alert(t('import_success'));
    }
  };

  const getAvailableLocations = (targetCellar?: Cellar): string[] => {
    const c = targetCellar || activeCellar;
    const prefix = getTranslation(c.settings.language, 'shelf_prefix');
    const shelves = Array.from({ length: c.settings.shelfCount }, (_, i) => `${prefix} ${i + 1}`);
    return [...shelves, getTranslation(c.settings.language, 'off_site')];
  };

  const availableLocations = getAvailableLocations();

  const getFontSizeClasses = (size: AppFontSize) => {
    switch(size) {
      case 'small': return { 
        title: 'text-sm', sub: 'text-[10px]', badgeLabel: 'text-[8px]', badgeValue: 'text-xs', 
        shelfTitle: 'text-base', shelfCount: 'text-sm', shelfCost: 'text-xs', shelfColorCount: 'text-sm', 
        statsValue: 'text-base', header: 'text-lg', tabLabel: 'text-[10px]',
        lg: 'text-sm', base: 'text-xs', sm: 'text-[10px]', cellarSub: 'text-[11px]'
      };
      case 'large': return { 
        title: 'text-xl', sub: 'text-base', badgeLabel: 'text-[12px]', badgeValue: 'text-lg', 
        shelfTitle: 'text-2xl', shelfCount: 'text-2xl', shelfCost: 'text-xl', shelfColorCount: 'text-2xl', 
        statsValue: 'text-3xl', header: 'text-3xl', tabLabel: 'text-sm',
        lg: 'text-xl', base: 'text-base', sm: 'text-sm', cellarSub: 'text-lg'
      };
      case 'medium':
      default: return { 
        title: 'text-base', sub: 'text-xs', badgeLabel: 'text-[10px]', badgeValue: 'text-sm', 
        shelfTitle: 'text-lg', shelfCount: 'text-lg', shelfCost: 'text-base', shelfColorCount: 'text-lg', 
        statsValue: 'text-xl', header: 'text-2xl', tabLabel: 'text-xs',
        lg: 'text-lg', base: 'text-sm', sm: 'text-xs', cellarSub: 'text-sm'
      };
    }
  };

  const fontClasses = getFontSizeClasses(settings.fontSize || 'medium');

  const filterList = <T extends Wine>(list: T[], isHistoryList: boolean = false): T[] => {
    if (Object.keys(searchFilters).length === 0) return list;
    return list.filter(item => {
      if (!item) return false;
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
    updateActiveCellar({ wines: [...wines, newWine] });
    setView('list');
  };

  const handleEditWine = (wineData: Omit<Wine, 'id'>) => {
    if (selectedWine && 'id' in selectedWine) {
        if (activeTab === 'history') {
          updateActiveCellar({ history: history.map(h => h.id === selectedWine.id ? { ...h, ...wineData } as HistoryEntry : h) });
        } else {
          updateActiveCellar({ wines: wines.map(w => w.id === selectedWine.id ? { ...wineData, id: selectedWine.id } as Wine : w) });
        }
        setView('detail');
    }
  };

  const handleTransferWine = (sourceWine: Wine, targetCellarId: string, quantity: number, location: string, isMove: boolean) => {
    // 1. Mise à jour de la cave cible
    setCellars(prev => prev.map(c => {
      if (c.id === targetCellarId) {
        const newWine: Wine = { ...sourceWine, id: Date.now().toString(), quantity, location };
        return { ...c, wines: [...c.wines, newWine] };
      }
      // 2. Si c'est un déplacement (move), on retire de la source
      if (isMove && c.id === activeCellarId) {
        const updatedWines = c.wines.map(w => {
          if (w.id === sourceWine.id) return { ...w, quantity: w.quantity - quantity };
          return w;
        }).filter(w => w.quantity > 0);
        return { ...c, wines: updatedWines };
      }
      return c;
    }));
    setView('list');
  };

  const handleDeleteWine = (id: string) => { updateActiveCellar({ wines: wines.filter(w => w.id !== id) }); setView('list'); };
  const handleDeleteHistory = (id: string) => { updateActiveCellar({ history: history.filter(h => h.id !== id) }); setView('list'); };

  const handleConsumeWine = (wine: Wine, rating: number, strength: number, consumeQty: number = 1) => {
    const existingHistoryIndex = history.findIndex(h => h.name === wine.name && h.year === wine.year && h.appellation === wine.appellation);
    let newHistory = [...history];
    if (existingHistoryIndex >= 0) {
        newHistory[existingHistoryIndex] = { ...newHistory[existingHistoryIndex], quantity: newHistory[existingHistoryIndex].quantity + consumeQty, consumptionRating: rating, strength, consumedDate: new Date().toISOString() };
    } else {
        const historyEntry: HistoryEntry = { ...wine, strength, consumedDate: new Date().toISOString(), consumptionRating: rating, quantity: consumeQty };
        newHistory.push(historyEntry);
    }
    
    const newWines = wines.map(w => w.id === wine.id ? { ...w, quantity: w.quantity - consumeQty } : w).filter(w => w.quantity > 0);
    updateActiveCellar({ wines: newWines, history: newHistory });
    setView('list');
  };

  const toggleShelf = (shelf: string) => setExpandedShelves(prev => ({ ...prev, [shelf]: !prev[shelf] }));
  const handleConfirmDeleteShelfAction = (shelfName: string) => {
    const offsiteLabel = t('off_site');
    updateActiveCellar({ wines: wines.map(w => w.location === shelfName ? { ...w, location: offsiteLabel } : w) });
    setShelfToDelete(null);
  };

  const getColorTheme = (color: WineColor) => {
    switch (color) {
      case WineColor.ROUGE: return 'border-l-rose-900 bg-rose-200/60 dark:bg-rose-950/40 dark:border-l-rose-700';
      case WineColor.BLANC: return 'border-l-yellow-500 bg-yellow-100/50 dark:bg-yellow-900/40 dark:border-l-yellow-400';
      case WineColor.ROSE: return 'border-l-pink-500 bg-pink-50/60 dark:bg-pink-900/20 dark:border-l-pink-400';
      default: return 'border-l-gray-300 bg-white dark:bg-stone-800';
    }
  };

  // --- RENDU ---

  const renderStatsBar = (items: Wine[]) => {
    const totalBottles = items.reduce((acc, item) => acc + (item?.quantity || 0), 0);
    const totalCost = items.reduce((acc, item) => acc + ((item?.price || 0) * (item?.quantity || 0)), 0);
    const avgPrice = totalBottles > 0 ? totalCost / totalBottles : 0;
    const isHistory = activeTab === 'history';
    return (
      <div className="grid grid-cols-3 gap-1.5 mb-4">
        <button onClick={() => activeTab === 'cellar' ? setIsQuantityModalOpen(true) : setIsHistoryQuantityModalOpen(true)} className="bg-white dark:bg-stone-800 p-2 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 flex flex-col items-center justify-center transition-all active:scale-95">
            <div className="flex items-center gap-1 text-stone-400 dark:text-stone-500 mb-0.5"><Hash size={10}/><span className="text-[9px] uppercase font-bold tracking-wide">{isHistory ? t('consumed') : t('bottles')}</span></div>
            <p className={`font-bold text-stone-800 dark:text-stone-100 leading-tight ${fontClasses.statsValue}`}>{totalBottles}</p>
        </button>
        <button onClick={() => setIsCostModalOpen(true)} className="bg-white dark:bg-stone-800 p-2 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 flex flex-col items-center justify-center transition-all active:scale-95">
             <div className="flex items-center gap-1 text-stone-400 dark:text-stone-500 mb-0.5"><Coins size={10}/><span className="text-[9px] uppercase font-bold tracking-wide">{t('total_cost')}</span></div>
            <p className={`font-bold text-stone-800 dark:text-stone-100 leading-tight ${fontClasses.statsValue}`}>{totalCost.toLocaleString(settings.language, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</p>
        </button>
        <div className="bg-white dark:bg-stone-800 p-2 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1 text-stone-400 dark:text-stone-500 mb-0.5"><Calculator size={10}/><span className="text-[9px] uppercase font-bold tracking-wide">{t('avg_price')}</span></div>
            <p className={`font-bold text-stone-800 dark:text-stone-100 leading-tight ${fontClasses.statsValue}`}>{avgPrice.toLocaleString(settings.language, { style: 'currency', currency: 'EUR', maximumFractionDigits: 1 })}</p>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (view === 'add') return <WineForm onSave={handleAddWine} onCancel={() => setView('list')} availableLocations={availableLocations} locationData={locationData} onOpenLocationManager={() => setIsLocationManagerOpen(true)} language={settings.language} fontSize={settings.fontSize} />;
    if (view === 'edit' && selectedWine) return <WineForm initialData={selectedWine} onSave={handleEditWine} onCancel={() => setView('detail')} availableLocations={availableLocations} locationData={locationData} onOpenLocationManager={() => setIsLocationManagerOpen(true)} language={settings.language} isHistoryMode={activeTab === 'history'} fontSize={settings.fontSize} />;
    if (view === 'detail' && selectedWine) return <WineDetail wine={selectedWine} cellars={cellars} currentCellarId={activeCellarId} onBack={() => setView('list')} onConsume={activeTab === 'history' ? undefined : handleConsumeWine} onDelete={activeTab === 'history' ? handleDeleteHistory : handleDeleteWine} onEdit={() => setView('edit')} onTransfer={handleTransferWine} onUpdateImage={(img) => updateActiveCellar({ [activeTab === 'history' ? 'history' : 'wines']: (activeTab === 'history' ? history : wines).map(x => x.id === selectedWine.id ? { ...x, image: img } : x) })} onEnlargeImage={setLargeImage} availableLocations={availableLocations} isHistory={activeTab === 'history'} language={settings.language} fontSize={settings.fontSize} />;
    if (activeTab === 'stats') return (
      <div className="pb-24 px-2 py-4">
        <div className="px-1 mb-1">
          <h1 className={`font-serif font-bold text-rose-950 dark:text-rose-100 ${fontClasses.header}`}>{t('stats')}</h1>
          <button onClick={() => setIsCellarSelectorOpen(true)} className="flex items-center gap-2 group">
            <span className={`font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest ${fontClasses.cellarSub}`}>{activeCellar.name}</span>
            <RefreshCw size={14} className="text-stone-300 group-hover:rotate-180 transition-transform duration-500"/>
          </button>
        </div>
        <StatsView wines={wines} history={history} language={settings.language} theme={settings.theme} fontSize={settings.fontSize} />
      </div>
    );
    
    if (activeTab === 'cellar') {
      return (
        <div className="pb-24 px-2 py-4 space-y-3">
          <div className="flex justify-between items-center mb-1 px-1">
            <div>
              <h1 className={`font-serif font-bold text-rose-950 dark:text-rose-100 ${fontClasses.header}`}>{t('app_title')}</h1>
              <button onClick={() => setIsCellarSelectorOpen(true)} className="flex items-center gap-2 group">
                <span className={`font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest ${fontClasses.cellarSub}`}>{activeCellar.name}</span>
                <RefreshCw size={14} className="text-stone-300 group-hover:rotate-180 transition-transform duration-500"/>
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsCellarManagerOpen(true)} className="p-2 rounded-full bg-white dark:bg-stone-800 text-stone-400 shadow-sm"><Warehouse size={22}/></button>
              <button onClick={() => setIsSearchOpen(true)} className={`p-2 rounded-full transition-all ${isFiltering ? 'bg-rose-100 dark:bg-rose-900 text-rose-900 shadow-sm' : 'bg-white dark:bg-stone-800 text-stone-400 shadow-sm'}`}><Search size={22} /></button>
              <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full bg-white dark:bg-stone-800 text-stone-400 shadow-sm"><SettingsIcon size={22} /></button>
              <button onClick={() => setIsInfoOpen(true)} className="p-2 rounded-full bg-white dark:bg-stone-800 text-stone-400 shadow-sm"><Info size={22} /></button>
            </div>
          </div>
          {renderStatsBar(filteredWines)}
          {availableLocations.map(shelfName => {
            const shelfWines = filteredWines.filter(w => w.location === shelfName);
            if (shelfWines.length === 0) return null;
            const isExpanded = expandedShelves[shelfName] || false;
            return (
              <div key={shelfName} className="bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-100/80 dark:border-stone-800 overflow-hidden">
                <button onClick={() => toggleShelf(shelfName)} className={`w-full flex justify-between items-center p-4 ${isExpanded ? 'bg-stone-50 dark:bg-stone-800 border-b border-stone-100 dark:border-stone-800' : ''}`}>
                  <div className="flex items-center gap-2.5">
                    <div className="text-stone-400">{isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</div>
                    <h2 className={`font-bold text-gray-800 dark:text-gray-100 ${fontClasses.shelfTitle}`}>{shelfName}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`bg-gray-100 dark:bg-stone-800 text-gray-600 dark:text-stone-300 font-bold px-2 py-0.5 rounded-full border border-gray-200 dark:border-stone-700 ${fontClasses.shelfCount}`}>{shelfWines.reduce((acc, w) => acc + w.quantity, 0)}</span>
                    {shelfName !== t('off_site') && <Trash2 size={18} className="text-stone-300 hover:text-red-500" onClick={(e) => { e.stopPropagation(); setShelfToDelete(shelfName); }} />}
                  </div>
                </button>
                {isExpanded && <div className="p-2 space-y-2">{shelfWines.map(wine => (
                  <div key={wine.id} onClick={() => { setSelectedWine(wine); setView('detail'); }} className={`flex gap-2.5 items-center p-2 rounded-lg cursor-pointer transition-all shadow-sm border-l-4 ${getColorTheme(wine.color)}`}>
                    <div className="w-12 h-12 rounded-full bg-white dark:bg-stone-800 flex-shrink-0 overflow-hidden border border-white dark:border-stone-700 relative">
                      {wine.image ? <img src={wine.image} className="w-full h-full object-cover" alt="" /> : <WineIcon className="w-5 h-5 m-auto mt-3.5 text-stone-300"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-gray-800 dark:text-gray-100 truncate leading-tight ${fontClasses.title}`}>{wine.name}</p>
                      <p className={`text-gray-500 dark:text-gray-400 truncate ${fontClasses.sub}`}>{wine.region} - {wine.year}</p>
                    </div>
                    <div className={`flex flex-col items-center justify-center w-9 h-9 rounded shadow-sm bg-white/50 dark:bg-stone-800 text-stone-600 dark:text-stone-300`}>
                      <span className={`uppercase font-bold opacity-60 leading-none ${fontClasses.badgeLabel}`}>{t('qty')}</span>
                      <span className={`font-bold leading-none mt-0.5 ${fontClasses.badgeValue}`}>{wine.quantity}</span>
                    </div>
                  </div>
                ))}</div>}
              </div>
            );
          })}
        </div>
      );
    }

    if (activeTab === 'history') {
      return (
        <div className="pb-24 px-2 py-4">
          <div className="px-1 mb-4">
            <h1 className={`font-serif font-bold text-stone-800 dark:text-stone-100 ${fontClasses.header}`}>{t('history')}</h1>
            <button onClick={() => setIsCellarSelectorOpen(true)} className="flex items-center gap-2 group">
              <span className={`font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest ${fontClasses.cellarSub}`}>{activeCellar.name}</span>
              <RefreshCw size={14} className="text-stone-300 group-hover:rotate-180 transition-transform duration-500"/>
            </button>
          </div>
          {renderStatsBar(filteredHistory as any)}
          <div className="space-y-3">
            {filteredHistory.map((entry) => (
              <div key={entry.id} onClick={() => { setSelectedWine(entry); setView('detail'); }} className={`flex gap-3 p-2.5 rounded-xl cursor-pointer shadow-sm border-l-4 ${getColorTheme(entry.color)}`}>
                <div className="w-12 h-12 rounded-lg bg-white dark:bg-stone-800 flex-shrink-0 overflow-hidden border border-stone-200">
                  {entry.image ? <img src={entry.image} className="w-full h-full object-cover" /> : <WineIcon className="w-full h-full p-3 text-stone-300"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className={`font-bold text-stone-800 dark:text-stone-100 truncate leading-tight ${fontClasses.title}`}>{entry.name}</h3>
                    <div className="flex items-center gap-0.5 text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1 rounded shadow-sm">
                      <span className={`font-bold text-amber-600 ${fontClasses.badgeValue}`}>{entry.consumptionRating}</span>
                      <Star size={10} className="fill-current" />
                    </div>
                  </div>
                  <p className={`text-stone-600 dark:text-stone-400 font-medium truncate ${fontClasses.sub}`}>{entry.appellation} - {entry.year}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  return (
    <div className={settings.theme === 'dark' ? 'dark' : ''}>
      <div className="bg-stone-200 dark:bg-stone-950 h-screen w-full flex justify-center overflow-hidden">
        <main className="w-full lg:max-w-4xl h-full bg-stone-100 dark:bg-black shadow-2xl relative flex flex-col transition-colors duration-300">
          <div key={`${activeCellarId}-${activeTab}-${view}`} className="flex-1 overflow-y-auto no-scrollbar relative">
            {renderContent()}
          </div>
          
          {view === 'list' && activeTab === 'cellar' && (
            <button onClick={() => setView('add')} className="absolute bottom-24 right-6 bg-rose-900 dark:bg-rose-700 text-white p-4 rounded-full shadow-lg shadow-rose-900/30 active:scale-95 z-30">
              <Plus size={28} />
            </button>
          )}

          {view === 'list' && (
            <div className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 z-40 safe-area-bottom">
              <div className="flex justify-around items-center h-20 pb-2">
                <button onClick={() => { setActiveTab('cellar'); setView('list'); }} className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'cellar' ? 'text-rose-900 dark:text-rose-400' : 'text-stone-400'}`}>
                  <LayoutGrid size={24} /><span className={`font-semibold ${fontClasses.tabLabel}`}>{t('cellar')}</span>
                </button>
                <button onClick={() => { setActiveTab('stats'); setView('list'); }} className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'stats' ? 'text-rose-900 dark:text-rose-400' : 'text-stone-400'}`}>
                  <PieChart size={24} /><span className={`font-semibold ${fontClasses.tabLabel}`}>{t('stats')}</span>
                </button>
                <button onClick={() => { setActiveTab('history'); setView('list'); }} className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'history' ? 'text-rose-900 dark:text-rose-400' : 'text-stone-400'}`}>
                  <History size={24} /><span className={`font-semibold ${fontClasses.tabLabel}`}>{t('history')}</span>
                </button>
              </div>
            </div>
          )}
        </main>

        <CellarManager cellars={cellars} activeCellarId={activeCellarId} isOpen={isCellarManagerOpen} onClose={() => setIsCellarManagerOpen(false)} onAdd={handleAddCellar} onDelete={handleDeleteCellar} onUpdate={(id, name, image) => setCellars(prev => prev.map(c => c.id === id ? { ...c, name, image } : c))} t={t} fs={fontClasses} />
        <CellarSelector cellars={cellars} isOpen={isCellarSelectorOpen} onClose={() => setIsCellarSelectorOpen(false)} onSelect={(id) => { setActiveCellarId(id); setIsCellarSelectorOpen(false); }} t={t} fs={fontClasses} />
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onSearch={setSearchFilters} currentFilters={searchFilters} onReset={() => setSearchFilters({})} locationData={locationData} language={settings.language} isHistoryMode={activeTab === 'history'} fontSize={settings.fontSize} />
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} onUpdateSettings={handleUpdateSettings} onExport={handleExport} onImport={handleImport} fontSize={settings.fontSize} />
        <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} fontSize={settings.fontSize} />
        <LocationManagerModal isOpen={isLocationManagerOpen} onClose={() => setIsLocationManagerOpen(false)} language={settings.language} locationData={locationData} onUpdateLocationData={setLocationData} fontSize={settings.fontSize} />

        {shelfToDelete && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-stone-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className={`font-serif font-bold text-rose-950 dark:text-rose-100 mb-6 text-center ${fontClasses.header}`}>{t('shelf_delete_title')}</h3>
              <SwipeSlider label={t('swipe_to_confirm')} onConfirm={() => handleConfirmDeleteShelfAction(shelfToDelete)} fontSizeClass={fontClasses.sm} />
              <button onClick={() => setShelfToDelete(null)} className={`w-full mt-4 py-3 text-stone-400 font-bold hover:text-stone-600 transition ${fontClasses.base}`}>{t('cancel')}</button>
            </div>
          </div>
        )}
        
        {largeImage && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setLargeImage(null)}>
            <div className="relative max-w-full max-h-[90vh] animate-in zoom-in-95 duration-200">
              <button className="absolute -top-4 -right-4 bg-white dark:bg-stone-800 p-2 rounded-full shadow-xl text-stone-800 dark:text-stone-100 z-10"><X size={20}/></button>
              <img src={largeImage} className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- MODAUX MULTI-CAVES ---

const CellarManager = ({ cellars, activeCellarId, isOpen, onClose, onAdd, onDelete, onUpdate, t, fs }: any) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [destroyBottles, setDestroyBottles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    if (editingId) onUpdate(editingId, name, image);
    else onAdd(name, image);
    reset();
  };

  const reset = () => { setIsAdding(false); setEditingId(null); setName(''); setImage(null); setDestroyBottles(false); };

  const handleImage = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-stone-900 rounded-3xl w-full max-w-sm flex flex-col shadow-2xl max-h-[85vh] overflow-hidden">
        <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-800/50">
          <h2 className={`font-serif font-bold text-rose-900 dark:text-rose-100 ${fs.lg}`}>{t('manage_cellars')}</h2>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-full bg-white dark:bg-stone-800 shadow-sm"><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {!isAdding && !editingId ? (
            <>
              <button onClick={() => setIsAdding(true)} className="w-full py-4 px-6 rounded-2xl bg-rose-900 dark:bg-rose-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                <Plus size={20}/> {t('new_cellar')}
              </button>
              <div className="space-y-3">
                {cellars.map((c: Cellar) => (
                  <div key={c.id} className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${c.id === activeCellarId ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-900/30' : 'bg-white dark:bg-stone-800 border-stone-100 dark:border-stone-700 shadow-sm'}`}>
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-white dark:border-stone-600 shadow-sm bg-stone-100 dark:bg-stone-700">
                      {c.image ? <img src={c.image} className="w-full h-full object-cover" /> : <Warehouse size={20} className="m-auto mt-3 text-stone-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-stone-800 dark:text-stone-100 truncate ${fs.base}`}>{c.name}</p>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{c.wines.length} {t('bottles')}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditingId(c.id); setName(c.name); setImage(c.image); }} className="p-2 text-stone-400 hover:text-rose-900 dark:hover:text-rose-400 transition-colors"><Pencil size={18}/></button>
                      {cellars.length > 1 && (
                        <button onClick={() => { setEditingId(c.id); setName(c.name); setImage(c.image); }} className="p-2 text-stone-400 hover:text-red-600 transition-colors"><Trash2 size={18}/></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-5 py-2 animate-in slide-in-from-right-2 duration-300">
              <div className="flex flex-col items-center gap-4">
                <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-3xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center border-2 border-dashed border-stone-300 dark:border-stone-600 overflow-hidden cursor-pointer relative">
                  {image ? <img src={image} className="w-full h-full object-cover" /> : <Camera size={32} className="text-stone-300" />}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><Pencil size={20} className="text-white" /></div>
                  <input type="file" ref={fileInputRef} onChange={handleImage} className="hidden" accept="image/*" />
                </div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{t('cellar_photo')}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest pl-1">{t('cellar_name')}</label>
                <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={t('default_cellar_name')} className={`w-full p-4 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-rose-900/20 text-stone-800 dark:text-stone-100 ${fs.base}`} />
              </div>

              {editingId && cellars.find((c: Cellar) => c.id === editingId)?.wines.length! > 0 && (
                <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/30 space-y-4">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="destroy" checked={destroyBottles} onChange={(e) => setDestroyBottles(e.target.checked)} className="w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500" />
                    <label htmlFor="destroy" className={`text-red-700 dark:text-red-400 font-bold leading-tight ${fs.base}`}>{t('destroy_bottles_confirm')}</label>
                  </div>
                  <SwipeSlider disabled={!destroyBottles} label={t('swipe_to_delete')} onConfirm={() => { onDelete(editingId); reset(); }} fontSizeClass={fs.sm} />
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-stone-100 dark:border-stone-800">
                <button onClick={reset} className="flex-1 py-4 font-bold text-stone-400 hover:text-stone-600 transition-colors">{t('cancel')}</button>
                {!destroyBottles && (
                  <button onClick={handleSave} disabled={!name.trim()} className="flex-1 py-4 rounded-2xl bg-rose-900 dark:bg-rose-700 text-white font-bold shadow-lg active:scale-95 transition-all disabled:opacity-50">
                    {t('save')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CellarSelector = ({ cellars, isOpen, onClose, onSelect, t, fs }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-stone-900 rounded-3xl w-full max-w-sm flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center">
          <h2 className={`font-serif font-bold text-rose-900 dark:text-rose-100 ${fs.lg}`}>{t('switch_cellar')}</h2>
          <button onClick={onClose} className="p-2 text-stone-400 rounded-full bg-stone-50 dark:bg-stone-800 shadow-sm"><X size={20}/></button>
        </div>
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto no-scrollbar">
          {cellars.map((c: Cellar) => (
            <div key={c.id} onClick={() => onSelect(c.id)} className="p-3 rounded-2xl border border-stone-100 dark:border-stone-700 bg-white dark:bg-stone-800 flex items-center gap-3 cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors shadow-sm">
               <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-white dark:border-stone-600 shadow-sm bg-stone-100 dark:bg-stone-700">
                  {c.image ? <img src={c.image} className="w-full h-full object-cover" /> : <Warehouse size={20} className="m-auto mt-3 text-stone-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-stone-800 dark:text-stone-100 truncate ${fs.base}`}>{c.name}</p>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{c.wines.length} {t('bottles')}</p>
                </div>
                <ArrowRight size={18} className="text-stone-300" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
