
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, LayoutGrid, History, Wine as WineIcon, Search, ChevronDown, ChevronRight, Calculator, Coins, Hash, PieChart, Settings as SettingsIcon, Info, Clock, Calendar, ArrowRight, X, Trash2, ChevronsRight, Warehouse, Pencil, Camera, RefreshCw, Star, AlertTriangle, Eye, ArrowUpDown, MapPin, Globe } from 'lucide-react';
import { Wine, HistoryEntry, WineColor, SearchFilters, AppSettings, BackupData, AppFontSize, LocationData, Cellar, ColorTheme } from './types';
import { WineForm } from './components/WineForm';
import { WineDetail } from './components/WineDetail';
import { SearchModal } from './components/SearchModal';
import { StatsView } from './components/StatsView';
import { SettingsModal } from './components/SettingsModal';
import { InfoModal } from './components/InfoModal';
import { LocationManagerModal } from './components/LocationManagerModal';
import { getTranslation, translations } from './translations';
import { COUNTRIES_FR, COUNTRIES_EN, REGIONS_BY_COUNTRY_FR, REGIONS_BY_COUNTRY_EN } from './constants';

// Interface étendue pour les résultats de recherche globale
interface SearchResultWine extends Wine {
  cellarId: string;
  cellarName: string;
}

// UI state types for navigation and views
type Tab = 'cellar' | 'stats' | 'history';
type View = 'list' | 'add' | 'edit' | 'detail';

const DEFAULT_SETTINGS: AppSettings = {
  language: 'fr',
  theme: 'light',
  shelfCount: 4,
  fontSize: 'medium',
  colorTheme: 'default'
};

const THEME_CONFIGS: Record<ColorTheme, { primary: string; primaryDark: string; bgSoft: string; border: string }> = {
  default: { primary: '#881337', primaryDark: '#4c0519', bgSoft: '#fff1f2', border: '#fda4af' },
  blue: { primary: '#2563eb', primaryDark: '#1e40af', bgSoft: '#eff6ff', border: '#bfdbfe' },
  red: { primary: '#ef4444', primaryDark: '#b91c1c', bgSoft: '#fef2f2', border: '#fecaca' },
  yellow: { primary: '#d97706', primaryDark: '#92400e', bgSoft: '#fffbeb', border: '#fef3c7' },
  mauve: { primary: '#7c3aed', primaryDark: '#5b21b6', bgSoft: '#f5f3ff', border: '#ddd6fe' },
  green: { primary: '#059669', primaryDark: '#065f46', bgSoft: '#ecfdf5', border: '#d1fae5' },
};

const compressImage = (base64: string, maxWidth = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
};

const SwipeSlider: React.FC<{ onConfirm: () => void, label: string, fontSizeClass: string, disabled?: boolean }> = ({ onConfirm, label, fontSizeClass, disabled }) => {
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
    if (newPercentage >= 98) { setIsDragging(false); onConfirm(); }
  };

  const handlePointerUp = () => { if (position < 98) { setIsDragging(false); setPosition(0); } };

  return (
    <div ref={containerRef} className={`relative w-full h-16 rounded-2xl overflow-hidden border shadow-inner touch-none transition-all ${disabled ? 'opacity-30' : 'opacity-100'} ${disabled ? 'bg-stone-100 dark:bg-stone-800' : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700'}`}>
      <div className="absolute top-0 left-0 h-full bg-[var(--theme-primary)]/10 transition-all duration-75" style={{ width: `${position}%` }} />
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity ${position > 50 ? 'opacity-0' : 'opacity-100'}`}>
        <span className={`font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest flex items-center gap-2 select-none ${fontSizeClass}`}>
          {label} <ChevronsRight size={18} className="animate-pulse" />
        </span>
      </div>
      <div onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} className={`absolute top-1 bottom-1 w-14 bg-[var(--theme-primary)] rounded-xl shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing z-20 transition-transform ${!isDragging ? 'duration-300 ease-out' : 'duration-0'}`} style={{ left: '4px', transform: `translateX(${position * (containerRef.current ? (containerRef.current.clientWidth - 64) : 0) / 100}px)` }}>
        <ChevronsRight size={24} className="text-white pointer-events-none" />
      </div>
    </div>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('cellar');
  const [view, setView] = useState<View>('list');
  const [selectedWine, setSelectedWine] = useState<Wine | HistoryEntry | null>(null);
  const [largeImage, setLargeImage] = useState<string | null>(null);
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isLocationManagerOpen, setIsLocationManagerOpen] = useState(false);
  const [isCellarManagerOpen, setIsCellarManagerOpen] = useState(false);
  const [isCellarSelectorOpen, setIsCellarSelectorOpen] = useState(false);
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false);
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [isHistoryQuantityModalOpen, setIsHistoryQuantityModalOpen] = useState(false);
  const [isSortAscending, setIsSortAscending] = useState(false);
  const [shelfToDelete, setShelfToDelete] = useState<string | null>(null);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});

  const [cellars, setCellars] = useState<Cellar[]>(() => {
    try {
      const saved = localStorage.getItem('my-wine-cellars-v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed as Cellar[];
        }
      }
    } catch (e) { console.error("Restore error", e); }

    return [{
      id: 'default',
      name: 'Ma cave',
      image: null,
      wines: [],
      settings: DEFAULT_SETTINGS
    }];
  });

  const [activeCellarId, setActiveCellarId] = useState<string>(() => {
    const saved = localStorage.getItem('active-cellar-id');
    if (saved && cellars.some(c => c.id === saved)) return saved;
    return cellars[0]?.id || 'default';
  });

  const [globalHistory, setGlobalHistory] = useState<HistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem('global-wine-history-v3');
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error("History restore error", e); }
    return [];
  });

  const activeCellar = useMemo(() => cellars.find(c => c.id === activeCellarId) || cellars[0], [cellars, activeCellarId]);
  const settings = activeCellar.settings || DEFAULT_SETTINGS;
  const wines = activeCellar.wines || [];
  const history = globalHistory || [];

  // Suggestions calculées sur TOUS les vins (toutes les caves + historique)
  const suggestions = useMemo(() => {
    const allWines = [...cellars.flatMap(c => c.wines || []), ...globalHistory];
    
    const extractUnique = (field: keyof Wine) => {
      const values = allWines
        .map(w => w[field])
        .filter(v => v && typeof v === 'string') as string[];
      return Array.from(new Set(values.map(v => v.trim()))).sort();
    };

    return {
      appellations: extractUnique('appellation'),
      origins: extractUnique('origin'),
      purchasePlaces: extractUnique('purchasePlace')
    };
  }, [cellars, globalHistory]);

  // Theme variable injection
  useEffect(() => {
    const theme = settings.theme || 'light';
    const colorTheme = settings.colorTheme || 'default';
    const config = THEME_CONFIGS[colorTheme];

    const root = document.documentElement;
    if (theme === 'light') {
      root.style.setProperty('--theme-primary', config.primary);
      root.style.setProperty('--theme-primary-dark', config.primaryDark);
      root.style.setProperty('--theme-bg-soft', config.bgSoft);
      root.style.setProperty('--theme-border', config.border);
    } else {
      // Dark mode has standard colors to maintain readability
      root.style.setProperty('--theme-primary', '#e11d48'); // rose-600
      root.style.setProperty('--theme-primary-dark', '#9f1239'); // rose-800
      root.style.setProperty('--theme-bg-soft', '#1c1917'); // stone-900
      root.style.setProperty('--theme-border', '#44403c'); // stone-700
    }
  }, [settings.theme, settings.colorTheme]);

  useEffect(() => {
    try {
      localStorage.setItem('my-wine-cellars-v3', JSON.stringify(cellars));
      localStorage.setItem('active-cellar-id', activeCellarId);
      localStorage.setItem('global-wine-history-v3', JSON.stringify(globalHistory));
    } catch (e) { console.error("Storage error", e); }
  }, [cellars, activeCellarId, globalHistory]);

  const updateActiveCellar = (updates: Partial<Cellar>) => {
    setCellars(prev => prev.map(c => c.id === activeCellarId ? { ...c, ...updates } : c));
  };

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

  const handleUpdateSettings = (newSettings: AppSettings) => {
    const globalChanged = 
      newSettings.language !== settings.language || 
      newSettings.theme !== settings.theme || 
      newSettings.fontSize !== settings.fontSize ||
      newSettings.colorTheme !== settings.colorTheme;

    setCellars(prev => prev.map(c => {
      let updatedCellar = { ...c };
      if (globalChanged) {
        updatedCellar.settings = { 
          ...c.settings, 
          language: newSettings.language,
          theme: newSettings.theme,
          fontSize: newSettings.fontSize,
          colorTheme: newSettings.colorTheme
        };
      }
      if (c.id === activeCellarId) {
        updatedCellar.settings.shelfCount = newSettings.shelfCount;
      }
      if (newSettings.language !== settings.language) {
        const oldPrefix = translations[settings.language].shelf_prefix;
        const newPrefix = translations[newSettings.language].shelf_prefix;
        const oldOffsite = translations[settings.language].off_site;
        const newOffsite = translations[newSettings.language].off_site;
        
        updatedCellar.wines = c.wines.map(wine => {
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
      return updatedCellar;
    }));
  };

  const availableLocations = useMemo(() => {
    const prefix = t('shelf_prefix');
    const shelves = Array.from({ length: settings.shelfCount || 0 }, (_, i) => `${prefix} ${i + 1}`);
    return [...shelves, t('off_site')];
  }, [settings.shelfCount, settings.language]);

  const getFontSizeClasses = (size: AppFontSize) => {
    switch(size) {
      case 'small': return { title: 'text-sm', sub: 'text-[10px]', badgeLabel: 'text-[8px]', badgeValue: 'text-xs', shelfTitle: 'text-base', shelfCount: 'text-sm', shelfCost: 'text-xs', shelfColorCount: 'text-sm', statsValue: 'text-base', header: 'text-lg', tabLabel: 'text-[10px]', lg: 'text-sm', base: 'text-xs', sm: 'text-[10px]', cellarSub: 'text-[11px]' };
      case 'large': return { title: 'text-xl', sub: 'text-base', badgeLabel: 'text-[12px]', badgeValue: 'text-lg', shelfTitle: 'text-2xl', shelfCount: 'text-2xl', shelfCost: 'text-xl', shelfColorCount: 'text-2xl', statsValue: 'text-3xl', header: 'text-3xl', tabLabel: 'text-sm', lg: 'text-xl', base: 'text-base', sm: 'text-sm', cellarSub: 'text-lg' };
      case 'medium': default: return { title: 'text-base', sub: 'text-xs', badgeLabel: 'text-[10px]', badgeValue: 'text-sm', shelfTitle: 'text-lg', shelfCount: 'text-lg', shelfCost: 'text-base', shelfColorCount: 'text-lg', statsValue: 'text-xl', header: 'text-2xl', tabLabel: 'text-xs', lg: 'text-lg', base: 'text-sm', sm: 'text-xs', cellarSub: 'text-sm' };
    }
  };

  const fontClasses = getFontSizeClasses(settings.fontSize || 'medium');

  const filterList = <T extends Wine>(list: T[], filters: SearchFilters, isHistoryList: boolean = false): T[] => {
    if (!list) return [];
    if (Object.keys(filters).length === 0) return list;
    return list.filter(item => {
      if (!item) return false;
      if (filters.name && !item.name?.toLowerCase().includes(filters.name.toLowerCase())) return false;
      if (filters.appellation && !item.appellation?.toLowerCase().includes(filters.appellation.toLowerCase())) return false;
      if (filters.region && item.region !== filters.region) return false;
      if (filters.country && item.country !== filters.country) return false;
      if (filters.color && item.color !== filters.color) return false;
      if (filters.year !== undefined && item.year !== filters.year) return false;
      if (filters.origin && !item.origin?.toLowerCase().includes(filters.origin.toLowerCase())) return false;
      if (filters.strength !== undefined && item.strength !== filters.strength) return false;
      if (filters.tag && !item.tag?.toLowerCase().includes(filters.tag.toLowerCase())) return false;
      if (!isHistoryList) {
        if (filters.recommendedYear !== undefined && item.recommendedYear !== filters.recommendedYear) return false;
        if (filters.agingPotential && item.agingPotential !== filters.agingPotential) return false;
      }
      return true;
    });
  };

  const isFiltering = Object.keys(searchFilters).length > 0;
  const isGlobalSearch = searchFilters.searchScope === 'all';

  const filteredWines = useMemo(() => {
    if (isGlobalSearch) {
      // Recherche dans toutes les caves
      const allWines: SearchResultWine[] = [];
      cellars.forEach(cellar => {
        const cellarFilteredWines = filterList(cellar.wines || [], searchFilters, false);
        cellarFilteredWines.forEach(w => {
          allWines.push({ ...w, cellarId: cellar.id, cellarName: cellar.name });
        });
      });
      return allWines;
    }
    // Recherche locale par défaut
    return filterList<Wine>(wines, searchFilters, false);
  }, [wines, cellars, searchFilters, isGlobalSearch]);

  const filteredHistory = useMemo(() => filterList<HistoryEntry>(history, searchFilters, true), [history, searchFilters]);

  const handleAddWine = (wineData: Omit<Wine, 'id'>) => {
    const newWine: Wine = { ...wineData, id: Date.now().toString() };
    updateActiveCellar({ wines: [...wines, newWine] });
    setView('list');
  };

  const handleEditWine = (wineData: Omit<Wine, 'id'>) => {
    if (selectedWine) {
        const updatedWine: any = { ...selectedWine, ...wineData };
        if (activeTab === 'history') {
          setGlobalHistory(prev => prev.map(h => h.id === selectedWine.id ? updatedWine : h));
        } else {
          updateActiveCellar({ wines: wines.map(w => w.id === selectedWine.id ? updatedWine : w) });
        }
        setSelectedWine(updatedWine);
        setView('detail');
    }
  };

  const handleTransferWine = (sourceWine: Wine, targetCellarId: string, quantity: number, location: string, isMove: boolean) => {
    setCellars(prev => prev.map(c => {
      if (c.id === targetCellarId) {
        const newWine: Wine = { ...sourceWine, id: Date.now().toString(), quantity, location };
        return { ...c, wines: [...(c.wines || []), newWine] };
      }
      if (isMove && c.id === activeCellarId) {
        const updatedWines = c.wines.map(w => w.id === sourceWine.id ? { ...w, quantity: w.quantity - quantity } : w).filter(w => w.quantity > 0);
        return { ...c, wines: updatedWines };
      }
      return c;
    }));
    setView('list');
  };

  const handleDeleteWine = (id: string) => { updateActiveCellar({ wines: wines.filter(w => w.id !== id) }); setView('list'); };
  const handleDeleteHistory = (id: string) => { setGlobalHistory(prev => prev.filter(h => h.id !== id)); setView('list'); };

  const handleConsumeWine = (wine: Wine, rating: number, strength: number, consumeQty: number = 1) => {
    const existingHistoryIndex = globalHistory.findIndex(h => 
      h.name === wine.name && 
      h.color === wine.color && 
      h.appellation === wine.appellation &&
      h.country === wine.country &&
      h.region === wine.region &&
      h.year === wine.year
    );

    let newHistory = [...globalHistory];
    if (existingHistoryIndex >= 0) {
        newHistory[existingHistoryIndex] = { 
          ...newHistory[existingHistoryIndex], 
          quantity: newHistory[existingHistoryIndex].quantity + consumeQty, 
          consumptionRating: rating, 
          strength, 
          image: wine.image, 
          consumedDate: new Date().toISOString(), 
          originalCellarName: activeCellar.name 
        };
    } else {
        const historyEntry: HistoryEntry = { 
          ...wine, 
          strength, 
          consumedDate: new Date().toISOString(), 
          consumptionRating: rating, 
          quantity: consumeQty, 
          originalCellarName: activeCellar.name 
        };
        newHistory.push(historyEntry);
    }

    const newWines = wines.map(w => w.id === wine.id ? { ...w, quantity: w.quantity - consumeQty } : w).filter(w => w.quantity > 0);
    updateActiveCellar({ wines: newWines });
    setGlobalHistory(newHistory);
    setView('list');
  };

  const handleSelectWine = (wine: Wine | SearchResultWine) => {
    if ('cellarId' in wine && wine.cellarId !== activeCellarId) {
      setActiveCellarId(wine.cellarId);
    }
    setSelectedWine(wine);
    setView('detail');
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

  const getConsumptionStatusColor = (wine: Wine) => {
    const currentYear = new Date().getFullYear();
    if (currentYear > wine.recommendedYear) return 'bg-red-500';
    if (currentYear === wine.recommendedYear) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const renderStatsBar = (items: Wine[]) => {
    const totalBottles = (items || []).reduce((acc, item) => acc + (item?.quantity || 0), 0);
    const totalCost = (items || []).reduce((acc, item) => acc + ((item?.price || 0) * (item?.quantity || 0)), 0);
    const avgPrice = totalBottles > 0 ? totalCost / totalBottles : 0;
    const isHistory = activeTab === 'history';
    return (
      <div className="grid grid-cols-3 gap-1.5 mb-4">
        <button onClick={() => { setIsHistoryQuantityModalOpen(isHistory); setIsQuantityModalOpen(!isHistory); setIsSortAscending(false); }} className="bg-white dark:bg-stone-800 p-2 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 flex flex-col items-center justify-center transition-all active:scale-95">
            <div className="flex items-center gap-1 text-stone-400 dark:text-stone-500 mb-0.5"><Hash size={10}/><span className="text-[9px] uppercase font-bold tracking-wide">{isHistory ? t('consumed') : t('bottles')}</span></div>
            <p className={`font-bold text-stone-800 dark:text-stone-100 leading-tight ${fontClasses.statsValue}`}>{totalBottles}</p>
        </button>
        <button onClick={() => { setIsCostModalOpen(true); setIsSortAscending(false); }} className="bg-white dark:bg-stone-800 p-2 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 flex flex-col items-center justify-center transition-all active:scale-95">
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

  const renderFloatingList = (isOpen: boolean, onClose: () => void, title: string, items: Wine[] | HistoryEntry[], sortType: 'consumption' | 'cost' | 'most_consumed') => {
    if (!isOpen || !items) return null;
    
    const sortedItems = [...items].sort((a: any, b: any) => {
        let valA, valB;
        if (sortType === 'consumption') {
            valA = a.recommendedYear;
            valB = b.recommendedYear;
        } else if (sortType === 'most_consumed') {
            valA = a.quantity;
            valB = b.quantity;
        } else {
            valA = (a.price || 0) * (a.quantity || 0);
            valB = (b.price || 0) * (b.quantity || 0);
        }
        return isSortAscending ? valA - valB : valB - valA;
    });

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-stone-900 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-stone-100 dark:border-stone-800 animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50/50 dark:bg-stone-800/50">
                    <div className="flex items-center gap-3">
                      <h2 className={`font-serif font-bold text-[var(--theme-primary)] dark:text-stone-100 ${fontClasses.lg}`}>{title}</h2>
                      <button onClick={() => setIsSortAscending(!isSortAscending)} className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-full bg-white dark:bg-stone-800 shadow-sm flex items-center gap-1 active:scale-95 transition-all" title={t('reverse_sort')}>
                        <ArrowUpDown size={16} />
                      </button>
                    </div>
                    <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-full bg-white dark:bg-stone-800 shadow-sm"><X size={20}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 no-scrollbar">
                    {sortedItems.map(wine => {
                        const yearsInCellar = Math.max(0, (new Date().getTime() - new Date(wine.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
                        const isHistoryEntry = 'consumedDate' in wine;
                        return (
                            <div key={wine.id} onClick={() => handleSelectWine(wine as any)} className={`flex gap-3 items-center p-3 rounded-xl cursor-pointer transition-all border-l-4 shadow-sm ${getColorTheme(wine.color)}`}>
                                <div className="w-14 h-14 rounded-full bg-white dark:bg-stone-800 flex-shrink-0 overflow-hidden border border-white dark:border-stone-700 shadow-sm relative">{wine.image ? <img src={wine.image} className="w-full h-full object-cover" alt="" /> : <WineIcon className="w-6 h-6 m-auto mt-4 text-stone-300 dark:text-stone-600"/>}</div>
                                <div className="flex-1 min-w-0"><p className={`font-bold text-stone-900 dark:text-white truncate leading-tight ${fontClasses.base}`}>{wine.name}</p><div className="flex items-center gap-1.5 mt-0.5 flex-wrap"><span className={`font-bold text-stone-500 dark:text-stone-400 uppercase ${fontClasses.sm}`}>{wine.year} • {new Date().getFullYear() - wine.year} {t('years_old')}</span>{!isHistoryEntry && <><div className="w-1 h-1 rounded-full bg-stone-300 dark:bg-stone-700"></div><span className={`font-bold text-stone-500 dark:text-stone-400 uppercase ${fontClasses.sm}`}>{wine.location}</span></>}</div><div className="flex items-center gap-3 mt-1.5">{sortType === 'consumption' ? <div className="flex items-center gap-1 text-[var(--theme-primary)] dark:text-rose-400 bg-[var(--theme-bg-soft)] dark:bg-rose-900/20 px-1.5 py-0.5 rounded border border-[var(--theme-border)] dark:border-rose-900/30"><Calendar size={10} /><span className={`font-bold ${fontClasses.sm}`}>{t('recommended_year')}: {wine.recommendedYear}</span></div> : sortType === 'most_consumed' && isHistoryEntry ? <div className="flex items-center gap-1 text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded border border-amber-100 dark:border-amber-900/30"><History size={10} /><span className={`font-bold ${fontClasses.sm}`}>{t('consumed_on')} {new Date((wine as HistoryEntry).consumedDate).toLocaleDateString()}</span></div> : <div className="flex items-center gap-1 text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-amber-900/30"><Coins size={10} /><span className={`font-bold ${fontClasses.sm}`}>{(wine.price * wine.quantity).toLocaleString(settings.language, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</span></div>}{sortType !== 'most_consumed' && <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400"><Clock size={10} /><span className={`font-medium ${fontClasses.sm}`}>{yearsInCellar} {t('years_old')} {t('time_in_cellar').toLowerCase()}</span></div>}{sortType === 'most_consumed' && <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400"><Hash size={10} /><span className={`font-bold ${fontClasses.sm}`}>{t('total_drunk')}: {wine.quantity}</span></div>}</div></div><ArrowRight size={16} className="text-stone-300 dark:text-stone-600 flex-shrink-0" /></div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
  };

  const handleAddCellar = async (name: string, image: string | null) => {
    const compressedImage = image ? await compressImage(image) : null;
    const newCellar: Cellar = { id: Date.now().toString(), name, image: compressedImage, wines: [], settings: { ...DEFAULT_SETTINGS, language: settings.language, theme: settings.theme, fontSize: settings.fontSize, colorTheme: settings.colorTheme } };
    setCellars(prev => [...prev, newCellar]);
    setActiveCellarId(newCellar.id);
  };

  const renderContent = () => {
    if (view === 'add') return <WineForm onSave={handleAddWine} onCancel={() => setView('list')} availableLocations={availableLocations} locationData={locationData} onOpenLocationManager={() => setIsLocationManagerOpen(true)} language={settings.language} fontSize={settings.fontSize} suggestions={suggestions} />;
    if (view === 'edit' && selectedWine) return <WineForm initialData={selectedWine} onSave={handleEditWine} onCancel={() => setView('detail')} availableLocations={availableLocations} locationData={locationData} onOpenLocationManager={() => setIsLocationManagerOpen(true)} language={settings.language} isHistoryMode={activeTab === 'history'} fontSize={settings.fontSize} suggestions={suggestions} />;
    if (view === 'detail' && selectedWine) return <WineDetail wine={selectedWine} cellars={cellars} currentCellarId={activeCellarId} onBack={() => setView('list')} onConsume={activeTab === 'history' ? undefined : handleConsumeWine} onDelete={activeTab === 'history' ? handleDeleteHistory : handleDeleteWine} onEdit={() => setView('edit')} onTransfer={handleTransferWine} onUpdateImage={activeTab === 'history' ? undefined : async (img) => { const compressed = await compressImage(img); updateActiveCellar({ wines: wines.map(x => x.id === selectedWine.id ? { ...x, image: compressed } : x) }); }} onEnlargeImage={setLargeImage} availableLocations={availableLocations} isHistory={activeTab === 'history'} language={settings.language} fontSize={settings.fontSize} />;
    
    if (activeTab === 'stats') return (
      <div className="pb-24 px-2 py-4">
        <div className="flex justify-between items-center mb-3 px-1">
          <div>
            <h1 className={`font-serif font-bold text-[var(--theme-primary-dark)] dark:text-stone-100 ${fontClasses.header}`}>{t('stats')}</h1>
            <div className="flex items-center gap-2">
              <span className={`font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest ${fontClasses.cellarSub}`}>{activeCellar.name}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full bg-white dark:bg-stone-800 text-stone-400 shadow-sm"><SettingsIcon size={22} /></button>
            <button onClick={() => setIsInfoOpen(true)} className="p-2 rounded-full bg-white dark:bg-stone-800 text-stone-400 shadow-sm"><Info size={22} /></button>
          </div>
        </div>
        <StatsView wines={wines} history={history} activeCellarName={activeCellar.name} onSelectCellar={() => setIsCellarSelectorOpen(true)} language={settings.language} theme={settings.theme} fontSize={settings.fontSize} />
      </div>
    );

    if (activeTab === 'cellar') return (
      <div className="pb-24 px-2 py-4 space-y-3">
        <div className="flex justify-between items-center mb-1 px-1">
          <div onClick={() => setIsCellarSelectorOpen(true)} className="cursor-pointer active:opacity-70 transition-opacity">
            <h1 className={`font-serif font-bold text-[var(--theme-primary-dark)] dark:text-stone-100 ${fontClasses.header}`}>{t('app_title')}</h1>
            <div className="flex items-center gap-2 group">
              <span className={`font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest ${fontClasses.cellarSub}`}>{activeCellar.name}</span>
              <RefreshCw size={14} className="text-stone-300 group-hover:rotate-180 transition-transform duration-500"/>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsCellarManagerOpen(true)} className="p-2 rounded-full bg-white dark:bg-stone-800 text-stone-400 shadow-sm"><Warehouse size={22}/></button>
            <button onClick={() => setIsSearchOpen(true)} className={`p-2 rounded-full transition-all ${isFiltering ? 'bg-[var(--theme-bg-soft)] text-[var(--theme-primary)] shadow-sm' : 'bg-white dark:bg-stone-800 text-stone-400 shadow-sm'}`}><Search size={22} /></button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full bg-white dark:bg-stone-800 text-stone-400 shadow-sm"><SettingsIcon size={22} /></button>
            <button onClick={() => setIsInfoOpen(true)} className="p-2 rounded-full bg-white dark:bg-stone-800 text-stone-400 shadow-sm"><Info size={22} /></button>
          </div>
        </div>
        {renderStatsBar(filteredWines)}

        {/* Global Search Specific View */}
        {isFiltering && isGlobalSearch ? (
          <div className="space-y-3 animate-in fade-in duration-500">
            <div className="flex items-center gap-2 px-2 pb-1 border-b border-stone-200 dark:border-stone-800">
              <Globe size={16} className="text-[var(--theme-primary)] dark:text-rose-400" />
              <h2 className={`font-bold text-stone-800 dark:text-stone-100 uppercase tracking-wider ${fontClasses.sub}`}>{t('search_all_cellars')}</h2>
            </div>
            {(filteredWines as SearchResultWine[]).map(wine => (
              <div key={wine.id} onClick={() => handleSelectWine(wine)} className={`flex gap-2.5 items-center p-3 rounded-xl cursor-pointer transition-all shadow-sm border-l-4 ${getColorTheme(wine.color)}`}>
                <div className="w-14 h-14 rounded-full bg-white dark:bg-stone-800 flex-shrink-0 overflow-hidden border border-white dark:border-stone-700 relative shadow-sm">{wine.image ? <img src={wine.image} className="w-full h-full object-cover" alt="" /> : <WineIcon className="w-6 h-6 m-auto mt-4 text-stone-300"/>}</div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-gray-800 dark:text-gray-100 truncate leading-tight ${fontClasses.title}`}>{wine.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className={`text-gray-500 dark:text-gray-400 truncate ${fontClasses.sub}`}>{wine.region} - {wine.year}</p>
                    <div className={`w-1.5 h-1.5 rounded-full ${getConsumptionStatusColor(wine)} flex-shrink-0`}></div>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-[var(--theme-primary)]/60 dark:text-rose-400/60 font-bold uppercase tracking-tight">
                    <MapPin size={10} />
                    <span>{wine.cellarName} / {wine.location}</span>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center w-9 h-9 rounded shadow-sm bg-white/50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex-shrink-0"><span className={`uppercase font-bold opacity-60 leading-none ${fontClasses.badgeLabel}`}>{t('qty')}</span><span className={`font-bold leading-none mt-0.5 ${fontClasses.badgeValue}`}>{wine.quantity}</span></div>
              </div>
            ))}
            {filteredWines.length === 0 && (
              <div className="text-center py-10">
                <p className="text-stone-400 italic">{t('no_results')}</p>
              </div>
            )}
          </div>
        ) : (
          /* Normal Grouped Shelf View */
          availableLocations.map(shelfName => {
            const shelfWines = filteredWines.filter(w => w.location === shelfName);
            if (shelfWines.length === 0) return null;
            const isExpanded = expandedShelves[shelfName] || false;
            const shelfQty = shelfWines.reduce((acc, w) => acc + (w.quantity || 0), 0);
            const shelfTotalCost = shelfWines.reduce((acc, w) => acc + ((w?.price || 0) * (w?.quantity || 0)), 0);
            const shelfColorCounts = shelfWines.reduce((acc, w) => { acc[w.color] = (acc[w.color] || 0) + (w.quantity || 0); return acc; }, { [WineColor.ROUGE]: 0, [WineColor.BLANC]: 0, [WineColor.ROSE]: 0 } as Record<WineColor, number>);
            return (
              <div key={shelfName} className="bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-100/80 dark:border-stone-800 overflow-hidden">
                <div className={`w-full flex justify-between items-center ${isExpanded ? 'bg-stone-50 dark:bg-stone-800 border-b border-stone-100 dark:border-stone-800' : ''}`}>
                  <button onClick={() => toggleShelf(shelfName)} className="flex-1 flex items-center justify-between p-4 gap-2.5 overflow-hidden text-left">
                      <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                          <div className="text-stone-400 flex-shrink-0">{isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</div>
                          <h2 className={`font-bold text-gray-800 dark:text-gray-100 truncate ${fontClasses.shelfTitle}`}>{shelfName}</h2>
                      </div>
                  </button>
                  <div className="flex items-center gap-2 px-3">
                    <div className="flex items-center gap-3 mr-1 text-stone-600 dark:text-stone-300">
                      {shelfColorCounts[WineColor.ROUGE] > 0 && <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-rose-950 dark:bg-rose-600 shadow-sm"></div><span className={`font-bold text-sm`}>{shelfColorCounts[WineColor.ROUGE]}</span></div>}
                      {shelfColorCounts[WineColor.BLANC] > 0 && <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-400 dark:bg-yellow-500 shadow-sm"></div><span className={`font-bold text-sm`}>{shelfColorCounts[WineColor.BLANC]}</span></div>}
                      {shelfColorCounts[WineColor.ROSE] > 0 && <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-pink-400 dark:bg-pink-500 shadow-sm"></div><span className={`font-bold text-sm`}>{shelfColorCounts[WineColor.ROSE]}</span></div>}
                    </div>
                    <span className={`text-stone-400 dark:text-stone-500 font-bold uppercase tracking-wide transition-all ${fontClasses.shelfCost}`}>{shelfTotalCost.toLocaleString(settings.language, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</span>
                    <span className={`bg-gray-100 dark:bg-stone-800 text-gray-600 dark:text-stone-300 font-bold px-2 py-0.5 rounded-full border border-gray-200 dark:border-stone-700 transition-all ${fontClasses.shelfCount}`}>{shelfQty}</span>
                    {shelfName !== t('off_site') && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShelfToDelete(shelfName); }} 
                            className="p-1.5 text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                  </div>
                </div>
                {isExpanded && <div className="p-2 space-y-2">{shelfWines.map(wine => (
                  <div key={wine.id} onClick={() => handleSelectWine(wine)} className={`flex gap-2.5 items-center p-2 rounded-lg cursor-pointer transition-all shadow-sm border-l-4 ${getColorTheme(wine.color)}`}>
                    <div className="w-12 h-12 rounded-full bg-white dark:bg-stone-800 flex-shrink-0 overflow-hidden border border-white dark:border-stone-700 relative">{wine.image ? <img src={wine.image} className="w-full h-full object-cover" alt="" /> : <WineIcon className="w-5 h-5 m-auto mt-3.5 text-stone-300"/>}</div>
                    <div className="flex-1 min-w-0"><p className={`font-bold text-gray-800 dark:text-gray-100 truncate leading-tight ${fontClasses.title}`}>{wine.name}</p><div className="flex items-center gap-1.5 mt-0.5"><p className={`text-gray-500 dark:text-gray-400 truncate ${fontClasses.sub}`}>{wine.region} - {wine.year}</p><div className={`w-1.5 h-1.5 rounded-full ${getConsumptionStatusColor(wine)} flex-shrink-0`}></div></div></div>
                    <div className="flex items-center gap-2">
                      {wine.image && (
                        <button onClick={(e) => { e.stopPropagation(); setLargeImage(wine.image); }} className="p-2 text-stone-400 hover:text-[var(--theme-primary)] transition-colors bg-white/50 dark:bg-stone-800 rounded-lg shadow-sm">
                          <Eye size={18} />
                        </button>
                      )}
                      <div className={`flex flex-col items-center justify-center w-9 h-9 rounded shadow-sm bg-white/50 dark:bg-stone-800 text-stone-600 dark:text-stone-300`}><span className={`uppercase font-bold opacity-60 leading-none ${fontClasses.badgeLabel}`}>{t('qty')}</span><span className={`font-bold leading-none mt-0.5 ${fontClasses.badgeValue}`}>{wine.quantity}</span></div>
                    </div>
                  </div>
                ))}</div>}
              </div>
            );
          })
        )}
      </div>
    );

    if (activeTab === 'history') return (
      <div className="pb-24 px-2 py-4">
        <div className="flex justify-between items-center mb-4 px-1">
          <div>
            <h1 className={`font-serif font-bold text-stone-800 dark:text-stone-100 ${fontClasses.header}`}>{t('history')}</h1>
            <div className="flex items-center gap-2">
              <span className={`font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest ${fontClasses.cellarSub}`}>{t('global')}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsSearchOpen(true)} className={`p-2 rounded-full transition-all ${isFiltering ? 'bg-[var(--theme-bg-soft)] text-[var(--theme-primary)] shadow-sm' : 'bg-white dark:bg-stone-800 text-stone-400 shadow-sm'}`}><Search size={22} /></button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full bg-white dark:bg-stone-800 text-stone-400 shadow-sm"><SettingsIcon size={22} /></button>
            <button onClick={() => setIsInfoOpen(true)} className="p-2 rounded-full bg-white dark:bg-stone-800 text-stone-400 shadow-sm"><Info size={22} /></button>
          </div>
        </div>
        {renderStatsBar(filteredHistory as any)}
        <div className="space-y-3">{filteredHistory.map((entry) => (
          <div key={entry.id} onClick={() => { setSelectedWine(entry); setView('detail'); }} className={`flex gap-3 p-2.5 rounded-xl cursor-pointer shadow-sm border-l-4 ${getColorTheme(entry.color)}`}>
            <div className="w-12 h-12 rounded-lg bg-white dark:bg-stone-800 flex-shrink-0 overflow-hidden border border-stone-200">{entry.image ? <img src={entry.image} className="w-full h-full object-cover" /> : <WineIcon className="w-full h-full p-3 text-stone-300"/>}</div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h3 className={`font-bold text-stone-800 dark:text-stone-100 truncate leading-tight ${fontClasses.title}`}>{entry.name}</h3>
                <div className="flex items-center gap-2">
                   {entry.image && (
                    <button onClick={(e) => { e.stopPropagation(); setLargeImage(entry.image); }} className="p-1.5 text-stone-400 hover:text-[var(--theme-primary)] transition-colors bg-white/50 dark:bg-stone-800 rounded-lg shadow-sm">
                      <Eye size={16} />
                    </button>
                  )}
                  <div className="flex items-center gap-0.5 text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1 rounded shadow-sm">
                    <span className={`font-bold text-amber-600 ${fontClasses.badgeValue}`}>{entry.consumptionRating}</span>
                    <Star size={10} className="fill-current" />
                  </div>
                </div>
              </div>
              <p className={`text-stone-600 dark:text-stone-400 font-medium truncate ${fontClasses.sub}`}>{entry.appellation} - {entry.year}</p>
              <div className="flex items-center justify-between mt-1">
                <p className={`text-stone-400 dark:text-stone-500 ${fontClasses.sub}`}>{t('consumed_on')} {new Date(entry.consumedDate).toLocaleDateString()}</p>
                <div className={`bg-white/50 dark:bg-stone-800 px-2 py-1 rounded text-stone-900 dark:text-stone-100 font-bold border border-stone-200 dark:border-stone-700 ${fontClasses.title}`}>{t('total_drunk')}: {entry.quantity}</div>
              </div>
            </div>
          </div>
        ))}</div>
      </div>
    );
  };

  return (
    <div className={settings.theme === 'dark' ? 'dark' : ''}>
      <div className="bg-stone-200 dark:bg-stone-950 h-screen w-full flex justify-center overflow-hidden">
        <main className="w-full lg:max-w-4xl h-full bg-stone-100 dark:bg-black shadow-2xl relative flex flex-col transition-colors duration-300">
          <div key={`${activeCellarId}-${activeTab}-${view}`} className="flex-1 overflow-y-auto no-scrollbar relative">{renderContent()}</div>
          {view === 'list' && activeTab === 'cellar' && <button onClick={() => setView('add')} className="absolute bottom-24 right-6 bg-[var(--theme-primary)] text-white p-4 rounded-full shadow-lg shadow-[var(--theme-primary)]/30 active:scale-95 z-30 transition-colors"><Plus size={28} /></button>}
          {view === 'list' && <div className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 z-40 safe-area-bottom"><div className="flex justify-around items-center h-20 pb-2"><button onClick={() => { setActiveTab('cellar'); setView('list'); }} className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'cellar' ? 'text-[var(--theme-primary)]' : 'text-stone-400'}`}><LayoutGrid size={24} /><span className={`font-semibold ${fontClasses.tabLabel}`}>{t('cellar')}</span></button><button onClick={() => { setActiveTab('stats'); setView('list'); }} className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'stats' ? 'text-[var(--theme-primary)]' : 'text-stone-400'}`}><PieChart size={24} /><span className={`font-semibold ${fontClasses.tabLabel}`}>{t('stats')}</span></button><button onClick={() => { setActiveTab('history'); setView('list'); }} className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'history' ? 'text-[var(--theme-primary)]' : 'text-stone-400'}`}><History size={24} /><span className={`font-semibold ${fontClasses.tabLabel}`}>{t('history')}</span></button></div></div>}
        </main>
        <CellarManager cellars={cellars} activeCellarId={activeCellarId} onSelect={(id: string) => setActiveCellarId(id)} isOpen={isCellarManagerOpen} onClose={() => setIsCellarManagerOpen(false)} onAdd={handleAddCellar} onDelete={(id: string) => { if (cellars.length <= 1) return; const next = cellars.filter(c => c.id !== id); setCellars(next); if (activeCellarId === id) setActiveCellarId(next[0].id); }} onUpdate={async (id: string, name: string, image: string | null) => { const compressed = image ? await compressImage(image) : null; setCellars(prev => prev.map(c => c.id === id ? { ...c, name, image: compressed } : c)); }} t={t} fs={fontClasses} />
        <CellarSelector cellars={cellars} isOpen={isCellarSelectorOpen} onClose={() => setIsCellarSelectorOpen(false)} onSelect={(id: string) => { setActiveCellarId(id); setIsCellarSelectorOpen(false); }} t={t} fs={fontClasses} />
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onSearch={setSearchFilters} currentFilters={searchFilters} onReset={() => setSearchFilters({})} locationData={locationData} language={settings.language} isHistoryMode={activeTab === 'history'} fontSize={settings.fontSize} />
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} onUpdateSettings={handleUpdateSettings} onExport={() => { const backup: BackupData = { cellars, activeCellarId, locations: locationData, globalHistory: globalHistory, timestamp: new Date().toISOString() }; const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `wine_cellar_backup_${new Date().toISOString().split('T')[0]}.json`; a.click(); URL.revokeObjectURL(url); }} onImport={(data: BackupData) => { if (data.cellars) { setCellars(data.cellars); setActiveCellarId(data.activeCellarId); if (data.locations) setLocationData(data.locations); if (data.globalHistory) setGlobalHistory(data.globalHistory); alert(t('import_success')); } }} fontSize={settings.fontSize} />
        <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} fontSize={settings.fontSize} />
        <LocationManagerModal isOpen={isLocationManagerOpen} onClose={() => setIsLocationManagerOpen(false)} language={settings.language} locationData={locationData} onUpdateLocationData={setLocationData} fontSize={settings.fontSize} />
        {renderFloatingList(isQuantityModalOpen, () => setIsQuantityModalOpen(false), t('priority_consumption'), wines, 'consumption')}
        {renderFloatingList(isCostModalOpen, () => setIsQuantityModalOpen(false), activeTab === 'history' ? t('history_value') : t('top_value_wines'), activeTab === 'history' ? history : wines, 'cost')}
        {renderFloatingList(isHistoryQuantityModalOpen, () => setIsHistoryQuantityModalOpen(false), t('most_consumed_wines'), history, 'most_consumed')}
        {shelfToDelete && <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"><div className="bg-white dark:bg-stone-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200"><h3 className={`font-serif font-bold text-[var(--theme-primary-dark)] dark:text-stone-100 mb-6 text-center ${fontClasses.header}`}>{t('shelf_delete_title')}</h3><SwipeSlider label={t('swipe_to_confirm')} onConfirm={() => handleConfirmDeleteShelfAction(shelfToDelete)} fontSizeClass={fontClasses.sm} /><button onClick={() => setShelfToDelete(null)} className={`w-full mt-4 py-3 text-stone-400 font-bold hover:text-stone-600 transition ${fontClasses.base}`}>{t('cancel')}</button></div></div>}
        {largeImage && <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setLargeImage(null)}><div className="relative max-w-full max-h-[90vh] animate-in zoom-in-95 duration-200"><button className="absolute -top-4 -right-4 bg-white dark:bg-stone-800 p-2 rounded-full shadow-xl text-stone-800 dark:text-stone-100 z-10"><X size={20}/></button><img src={largeImage} className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" alt="Wine" /></div></div>}
      </div>
    </div>
  );
}

const CellarManager = ({ cellars, activeCellarId, onSelect, isOpen, onClose, onAdd, onDelete, onUpdate, t, fs }: any) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [destroyBottles, setDestroyBottles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => { setIsAdding(false); setEditingId(null); setDeletingId(null); setName(''); setImage(null); setDestroyBottles(false); };

  useEffect(() => { if (isOpen) reset(); }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => { if (editingId) onUpdate(editingId, name, image); else onAdd(name, image); reset(); };
  const handleImage = (e: any) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (ev) => setImage(ev.target?.result as string); reader.readAsDataURL(file); } };

  const cellarToProcess = deletingId ? cellars.find((c: any) => c.id === deletingId) : null;
  const wineStock = cellarToProcess?.wines?.reduce((acc: number, w: Wine) => acc + (w.quantity || 0), 0) || 0;
  const hasItems = wineStock > 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-stone-900 rounded-3xl w-full max-w-sm flex flex-col shadow-2xl max-h-[85vh] overflow-hidden">
        <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-800/50">
          <h2 className={`font-serif font-bold text-[var(--theme-primary)] dark:text-stone-100 ${fs.lg}`}>
            {deletingId ? t('delete_cellar_title') : (isAdding ? t('new_cellar') : (editingId ? t('edit_cellar') : t('manage_cellars')))}
          </h2>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-full bg-white dark:bg-stone-800 shadow-sm"><X size={20}/></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {!isAdding && !editingId && !deletingId ? (
            <>
              <button onClick={() => setIsAdding(true)} className="w-full py-4 px-6 rounded-2xl bg-[var(--theme-primary)] text-white font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"><Plus size={20}/> {t('new_cellar')}</button>
              <div className="space-y-3">
                {(cellars || []).map((c: Cellar) => (
                  <div key={c.id} className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${c.id === activeCellarId ? 'bg-[var(--theme-bg-soft)] border-[var(--theme-border)] shadow-md ring-1 ring-[var(--theme-border)]' : 'bg-white dark:bg-stone-800 border-stone-100 dark:border-stone-700 shadow-sm'}`}>
                    <div onClick={() => onSelect(c.id)} className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-white dark:border-stone-600 shadow-sm bg-stone-100 dark:bg-stone-700 cursor-pointer">
                      {c.image ? <img src={c.image} className="w-full h-full object-cover" alt="" /> : <Warehouse size={20} className="m-auto mt-3 text-stone-400" />}
                    </div>
                    <div onClick={() => onSelect(c.id)} className="flex-1 min-w-0 cursor-pointer">
                      <p className={`font-bold text-stone-800 dark:text-stone-100 truncate ${fs.base}`}>{c.name}</p>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                        {(c.wines || []).reduce((acc, w) => acc + (w.quantity || 0), 0)} {t('bottles')}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => onSelect(c.id)} className={`p-2 rounded-full transition-colors ${c.id === activeCellarId ? 'text-[var(--theme-primary)] bg-[var(--theme-bg-soft)]' : 'text-stone-400 hover:bg-stone-100'}`}><Eye size={18}/></button>
                      <button onClick={() => { setEditingId(c.id); setName(c.name); setImage(c.image); }} className={`p-2 text-stone-400 hover:text-[var(--theme-primary)] dark:hover:text-rose-400 transition-colors`}><Pencil size={18}/></button>
                      {cellars.length > 1 && (
                        <button onClick={() => { setDeletingId(c.id); setDestroyBottles(false); }} className="p-2 text-stone-400 hover:text-red-600 transition-colors"><Trash2 size={18}/></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : deletingId ? (
            <div className="space-y-6 py-2 animate-in slide-in-from-right-2 duration-300">
              <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-2xl border border-red-100 dark:border-red-900/30 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
                  <AlertTriangle size={32} />
                </div>
                <h3 className={`font-bold text-red-900 dark:text-red-300 mb-1 ${fs.lg}`}>{t('delete_cellar_title')}</h3>
                <p className={`text-red-700 dark:text-red-400 font-bold ${fs.base}`}>{t('delete_cellar_warning')}</p>
                
                {hasItems && (
                  <div className="mt-4 w-full">
                    <div className="bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-red-100 dark:border-red-900/20">
                      <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">{t('remaining_bottles')}</p>
                      <p className={`font-bold text-red-700 dark:text-red-300 ${fs.lg}`}>{wineStock} {t('bottles').toLowerCase()}</p>
                    </div>
                  </div>
                )}
              </div>

              {hasItems ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-stone-50 dark:bg-stone-800 p-3 rounded-xl border border-stone-100 dark:border-stone-700">
                    <input type="checkbox" id="destroy-confirm" checked={destroyBottles} onChange={(e) => setDestroyBottles(e.target.checked)} className="w-5 h-5 rounded border-stone-300 text-red-600 focus:ring-red-500" />
                    <label htmlFor="destroy-confirm" className={`text-stone-700 dark:text-stone-300 font-bold leading-tight ${fs.base}`}>
                      {t('destroy_bottles_confirm')}
                    </label>
                  </div>
                  <SwipeSlider disabled={!destroyBottles} label={t('swipe_to_confirm')} onConfirm={() => { onDelete(deletingId); reset(); }} fontSizeClass={fs.sm} />
                </div>
              ) : (
                <div className="space-y-4">
                  <SwipeSlider label={t('swipe_to_confirm')} onConfirm={() => { onDelete(deletingId); reset(); }} fontSizeClass={fs.sm} />
                </div>
              )}

              <button onClick={reset} className={`w-full py-4 font-bold text-stone-400 hover:text-stone-600 transition-colors ${fs.base}`}>
                {t('cancel')}
              </button>
            </div>
          ) : (
            <div className="space-y-5 py-2 animate-in slide-in-from-right-2 duration-300">
              <div className="flex flex-col items-center gap-4">
                <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-3xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center border-2 border-dashed border-stone-300 dark:border-stone-600 overflow-hidden cursor-pointer relative">
                  {image ? <img src={image} className="w-full h-full object-cover" alt="" /> : <Camera size={32} className="text-stone-300" />}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Pencil size={20} className="text-white" />
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleImage} className="hidden" accept="image/*" />
                </div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{t('cellar_photo')}</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest pl-1">{t('cellar_name')}</label>
                <input 
                  autoFocus 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder={t('default_cellar_name')} 
                  className={`w-full p-4 rounded-2xl bg-[var(--theme-bg-soft)] dark:bg-stone-800 border-2 border-[var(--theme-border)] focus:border-[var(--theme-primary)] outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/20 text-stone-800 dark:text-stone-100 transition-all ${fs.base}`} 
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-stone-100 dark:border-stone-800">
                <button onClick={reset} className="flex-1 py-4 font-bold text-stone-400 hover:text-stone-600 transition-colors">{t('cancel')}</button>
                <button onClick={handleSave} disabled={!name.trim()} className={`flex-1 py-4 rounded-2xl bg-[var(--theme-primary)] text-white font-bold shadow-lg active:scale-95 transition-all disabled:opacity-50`}>{t('save')}</button>
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
        <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center"><h2 className={`font-serif font-bold text-[var(--theme-primary)] dark:text-stone-100 ${fs.lg}`}>{t('switch_cellar')}</h2><button onClick={onClose} className="p-2 text-stone-400 rounded-full bg-stone-50 dark:bg-stone-800 shadow-sm"><X size={20}/></button></div>
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto no-scrollbar">{(cellars || []).map((c: Cellar) => (
          <div key={c.id} onClick={() => onSelect(c.id)} className="p-3 rounded-2xl border border-stone-100 dark:border-stone-700 bg-white dark:bg-stone-800 flex items-center gap-3 cursor-pointer hover:bg-[var(--theme-bg-soft)] dark:hover:bg-rose-900/10 transition-colors shadow-sm">
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-white dark:border-stone-600 shadow-sm bg-stone-100 dark:bg-stone-700">
              {c.image ? <img src={c.image} className="w-full h-full object-cover" alt="" /> : <Warehouse size={20} className="m-auto mt-3 text-stone-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-bold text-stone-800 dark:text-stone-100 truncate ${fs.base}`}>{c.name}</p>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                {(c.wines || []).reduce((acc, w) => acc + (w.quantity || 0), 0)} {t('bottles')}
              </p>
            </div>
            <ArrowRight size={18} className="text-stone-300" />
          </div>
        ))}</div>
      </div>
    </div>
  );
};

export default App;
