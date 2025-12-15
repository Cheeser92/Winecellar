import React, { useState, useEffect } from 'react';
import { Plus, LayoutGrid, History, Wine as WineIcon, Search, XCircle, ChevronDown, ChevronRight, Calculator, Coins, Hash, PieChart, Settings as SettingsIcon, Info } from 'lucide-react';
import { Wine, HistoryEntry, WineColor, SearchFilters, AppSettings, LOCATION_HORS_CAVE, BackupData, AppFontSize } from './types';
import { WineForm } from './components/WineForm';
import { WineDetail } from './components/WineDetail';
import { SearchModal } from './components/SearchModal';
import { StatsView } from './components/StatsView';
import { SettingsModal } from './components/SettingsModal';
import { getTranslation } from './translations';

type View = 'list' | 'history' | 'add' | 'detail' | 'edit';
type Tab = 'cellar' | 'stats' | 'history';

const DEFAULT_SETTINGS: AppSettings = {
  language: 'fr',
  theme: 'light',
  shelfCount: 4,
  fontSize: 'medium'
};

// URL de l'image pour le Splash Screen (Image de cave à vin générique)
const SPLASH_IMAGE_URL = "https://images.unsplash.com/photo-1585553616435-2dc0a54e271d?q=80&w=2574&auto=format&fit=crop";

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('cellar');
  const [view, setView] = useState<View>('list');
  const [selectedWine, setSelectedWine] = useState<Wine | HistoryEntry | null>(null);
  
  // Settings & Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('my-wine-cellar-settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  // Splash Screen State
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);

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

  // Splash Screen Effect
  useEffect(() => {
    // Commence le fondu après 3 secondes (pour durer 1s et finir à 4s)
    const fadeTimer = setTimeout(() => {
        setSplashFading(true);
    }, 3000);

    // Supprime complètement l'écran après 4 secondes
    const removeTimer = setTimeout(() => {
        setShowSplash(false);
    }, 4000);

    return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
    };
  }, []);

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

  // Handle Shelf Logic when settings change
  const handleUpdateSettings = (newSettings: AppSettings) => {
    // If shelf count decreased, move wines from deleted shelves to "Hors Cave"
    if (newSettings.shelfCount < settings.shelfCount) {
        const updatedWines = wines.map(wine => {
             const match = wine.location.match(/(\d+)/);
             if (match) {
                 const shelfNum = parseInt(match[0]);
                 if (shelfNum > newSettings.shelfCount) {
                     return { ...wine, location: LOCATION_HORS_CAVE };
                 }
             }
             return wine;
        });
        setWines(updatedWines);
    }
    setSettings(newSettings);
  };

  // Export Data Logic
  const handleExport = () => {
    const backup: BackupData = {
      wines,
      history,
      settings,
      timestamp: new Date().toISOString()
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `wine_cellar_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Import Data Logic
  const handleImport = (data: BackupData) => {
    setWines(data.wines);
    setHistory(data.history);
    setSettings(data.settings);
    // Refresh view and close modal
    setActiveTab('cellar');
    setView('list');
    setIsSettingsOpen(false);
    alert(t('import_success'));
  };

  // Generate Available Locations based on Settings
  const getAvailableLocations = (): string[] => {
    const prefix = t('shelf_prefix');
    const shelves = Array.from({ length: settings.shelfCount }, (_, i) => `${prefix} ${i + 1}`);
    return [...shelves, t('off_site')]; // Use translated "Hors cave"
  };

  const availableLocations = getAvailableLocations();

  // Helper for font sizes
  const getFontSizeClasses = (size: AppFontSize) => {
    switch(size) {
      case 'small':
        return {
          title: 'text-sm',
          sub: 'text-[10px]',
          badgeLabel: 'text-[9px]',
          badgeValue: 'text-xs',
          shelfTitle: 'text-base',
          shelfCount: 'text-xs'
        };
      case 'large':
        return {
          title: 'text-lg',
          sub: 'text-sm',
          badgeLabel: 'text-[11px]',
          badgeValue: 'text-base',
          shelfTitle: 'text-xl',
          shelfCount: 'text-sm'
        };
      case 'medium':
      default:
        return {
          title: 'text-base',
          sub: 'text-xs',
          badgeLabel: 'text-[10px]',
          badgeValue: 'text-sm',
          shelfTitle: 'text-lg',
          shelfCount: 'text-xs'
        };
    }
  };

  const fontClasses = getFontSizeClasses(settings.fontSize || 'medium');

  // Filtering Logic
  const filterList = <T extends Wine>(list: T[]): T[] => {
    const hasFilters = Object.keys(searchFilters).length > 0;
    if (!hasFilters) return list;

    return list.filter(item => {
      if (searchFilters.name && !item.name.toLowerCase().includes(searchFilters.name.toLowerCase())) return false;
      if (searchFilters.appellation && !item.appellation.toLowerCase().includes(searchFilters.appellation.toLowerCase())) return false;
      if (searchFilters.region && item.region !== searchFilters.region) return false;
      if (searchFilters.country && !item.country.toLowerCase().includes(searchFilters.country.toLowerCase())) return false;
      if (searchFilters.color && item.color !== searchFilters.color) return false;
      if (searchFilters.year !== undefined && item.year !== searchFilters.year) return false;
      if (searchFilters.origin && !item.origin.toLowerCase().includes(searchFilters.origin.toLowerCase())) return false;
      if (searchFilters.recommendedYear !== undefined && item.recommendedYear !== searchFilters.recommendedYear) return false;
      if (searchFilters.strength !== undefined && item.strength !== searchFilters.strength) return false;
      if (searchFilters.agingPotential && item.agingPotential !== searchFilters.agingPotential) return false;
      return true;
    });
  };

  const filteredWines = filterList<Wine>(wines);
  const filteredHistory = filterList<HistoryEntry>(history);
  const isFiltering = Object.keys(searchFilters).length > 0;

  // Actions
  const handleAddWine = (wineData: Omit<Wine, 'id'>) => {
    const newWine: Wine = {
      ...wineData,
      id: Date.now().toString(),
    };
    setWines(prev => [...prev, newWine]);
    setView('list');
    setActiveTab('cellar');
  };

  const handleEditWine = (wineData: Omit<Wine, 'id'>) => {
    if (selectedWine && 'id' in selectedWine) {
        const updatedWine = { ...wineData, id: selectedWine.id } as Wine;
        setWines(prev => prev.map(w => w.id === selectedWine.id ? updatedWine : w));
        setSelectedWine(updatedWine);
        setView('detail');
    }
  };

  const handleDeleteWine = (id: string) => {
    setWines(prev => prev.filter(w => w.id !== id));
    setView('list');
  };

  const handleDeleteHistory = (id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id));
    setView('list');
  };

  const handleConsumeWine = (wine: Wine, rating: number, strength: number) => {
    const existingHistoryIndex = history.findIndex(h => h.name === wine.name && h.year === wine.year && h.appellation === wine.appellation);
    let newHistory;
    
    // Create history entry logic with updated strength
    if (existingHistoryIndex >= 0) {
        newHistory = [...history];
        newHistory[existingHistoryIndex] = {
            ...newHistory[existingHistoryIndex],
            quantity: newHistory[existingHistoryIndex].quantity + 1,
            consumptionRating: rating,
            strength: strength, // Update strength if changed
            consumedDate: new Date().toISOString()
        };
    } else {
        const historyEntry: HistoryEntry = {
          ...wine,
          strength: strength, // Use the strength from modal
          consumedDate: new Date().toISOString(),
          consumptionRating: rating,
          quantity: 1
        };
        newHistory = [...history, historyEntry];
    }
    setHistory(newHistory);
    
    // Decrease quantity or remove from wines
    if (wine.quantity > 1) {
      setWines(prev => prev.map(w => w.id === wine.id ? { ...w, quantity: w.quantity - 1 } : w));
      setView('list');
    } else {
      setWines(prev => prev.filter(w => w.id !== wine.id));
      setView('list');
    }
  };

  const toggleShelf = (shelf: string) => {
    setExpandedShelves(prev => ({ ...prev, [shelf]: !prev[shelf] }));
  };

  const getColorTheme = (color: WineColor) => {
    switch (color) {
      case WineColor.ROUGE:
        return 'border-l-rose-700 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/40 dark:hover:bg-rose-900/60 dark:border-l-rose-600';
      case WineColor.BLANC:
        return 'border-l-yellow-500 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:hover:bg-yellow-900/60 dark:border-l-yellow-400';
      case WineColor.ROSE:
        return 'border-l-pink-500 bg-pink-100 hover:bg-pink-200 dark:bg-pink-900/40 dark:hover:bg-pink-900/60 dark:border-l-pink-400';
      default:
        return 'border-l-gray-300 bg-white dark:bg-stone-800';
    }
  };

  const getQuantityBadgeStyle = (color: WineColor) => {
    switch (color) {
        case WineColor.ROUGE:
            return 'bg-rose-100 dark:bg-rose-900/40 text-rose-900 dark:text-rose-100 border border-rose-200 dark:border-rose-800';
        case WineColor.BLANC:
            return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-100 border border-yellow-200 dark:border-yellow-800';
        case WineColor.ROSE:
            return 'bg-pink-100 dark:bg-pink-900/40 text-pink-900 dark:text-pink-100 border border-pink-200 dark:border-pink-800';
        default:
            return 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700';
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
    
    return (
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white dark:bg-stone-800 p-2.5 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 flex flex-col items-center justify-center transition-colors">
            <div className="flex items-center gap-1 text-stone-400 dark:text-stone-500 mb-0.5">
               <Hash size={12}/>
               <span className="text-[10px] uppercase font-bold tracking-wide">{t('bottles')}</span>
            </div>
            <p className="text-lg font-bold text-stone-800 dark:text-stone-100">{totalBottles}</p>
        </div>
        <div className="bg-white dark:bg-stone-800 p-2.5 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 flex flex-col items-center justify-center transition-colors">
             <div className="flex items-center gap-1 text-stone-400 dark:text-stone-500 mb-0.5">
               <Coins size={12}/>
               <span className="text-[10px] uppercase font-bold tracking-wide">{t('total_cost')}</span>
            </div>
            <p className="text-lg font-bold text-stone-800 dark:text-stone-100">{totalCost.toLocaleString(settings.language, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-white dark:bg-stone-800 p-2.5 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 flex flex-col items-center justify-center transition-colors">
            <div className="flex items-center gap-1 text-stone-400 dark:text-stone-500 mb-0.5">
               <Calculator size={12}/>
               <span className="text-[10px] uppercase font-bold tracking-wide">{t('avg_price')}</span>
            </div>
            <p className="text-lg font-bold text-stone-800 dark:text-stone-100">{avgPrice.toLocaleString(settings.language, { style: 'currency', currency: 'EUR', maximumFractionDigits: 1 })}</p>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (view === 'add') {
      return <WineForm onSave={handleAddWine} onCancel={() => setView('list')} availableLocations={availableLocations} language={settings.language} />;
    }

    if (view === 'edit' && selectedWine) {
      return <WineForm initialData={selectedWine} onSave={handleEditWine} onCancel={() => setView('detail')} availableLocations={availableLocations} language={settings.language} />;
    }

    if (view === 'detail' && selectedWine) {
      const isHistoryItem = activeTab === 'history';
      return (
        <WineDetail 
          wine={selectedWine} 
          onBack={() => setView('list')} 
          onConsume={isHistoryItem ? undefined : handleConsumeWine}
          onDelete={isHistoryItem ? handleDeleteHistory : handleDeleteWine}
          onEdit={isHistoryItem ? undefined : () => setView('edit')}
          isHistory={isHistoryItem}
          language={settings.language}
        />
      );
    }

    if (activeTab === 'stats') {
      return <StatsView wines={wines} history={history} language={settings.language} theme={settings.theme} />;
    }

    if (activeTab === 'cellar') {
      // Group logic using the dynamic availableLocations
      const shelvesToRender = availableLocations; 

      return (
        <div className="pb-24 p-4 space-y-4">
            <div className="flex justify-between items-center mb-2 px-2 pt-2">
                <h1 className="text-3xl font-serif font-bold text-rose-950 dark:text-rose-100">{t('app_title')}</h1>
                <div className="flex gap-2">
                    <button 
                      onClick={() => setIsSearchOpen(true)}
                      className={`p-2 rounded-full transition-all ${isFiltering ? 'bg-rose-100 dark:bg-rose-900 text-rose-900 dark:text-rose-100 shadow-sm' : 'bg-white dark:bg-stone-800 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 shadow-sm'}`}
                    >
                      {isFiltering ? <div className="relative"><Search size={24} /><div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-600 rounded-full border border-white"></div></div> : <Search size={24} />}
                    </button>
                    <button 
                      onClick={() => setIsInfoOpen(true)}
                      className="p-2 rounded-full bg-white dark:bg-stone-800 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 shadow-sm transition-all"
                    >
                      <Info size={24} />
                    </button>
                    <button 
                      onClick={() => setIsSettingsOpen(true)}
                      className="p-2 rounded-full bg-white dark:bg-stone-800 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 shadow-sm transition-all"
                    >
                      <SettingsIcon size={24} />
                    </button>
                </div>
            </div>

            {renderStatsBar(filteredWines)}

            {isFiltering && (
              <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-900/50 rounded-lg p-3 flex justify-between items-center text-sm text-rose-800 dark:text-rose-200">
                <span>{t('active_filters')} ({filteredWines.length})</span>
                <button onClick={() => setSearchFilters({})} className="flex items-center gap-1 font-semibold text-xs bg-white dark:bg-stone-800 px-2 py-1 rounded shadow-sm border border-rose-100 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-stone-700">
                  <XCircle size={14}/> Effacer
                </button>
              </div>
            )}

            {filteredWines.length === 0 && (
                <div className="text-center py-20 text-stone-400 dark:text-stone-600 flex flex-col items-center">
                    <div className="w-20 h-20 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mb-4">
                      {isFiltering ? <Search size={40} className="opacity-40"/> : <WineIcon size={40} className="opacity-40"/>}
                    </div>
                    <p className="font-medium">{isFiltering ? t('no_results') : t('empty_cellar')}</p>
                    {!isFiltering && <p className="text-sm mt-2 max-w-[200px]">{t('empty_cellar_sub')}</p>}
                </div>
            )}
            
            {shelvesToRender.map(shelfName => {
                const shelfWines = filteredWines.filter(w => {
                    if (w.location === shelfName) return true;
                    // Fallback for translation changes
                    const wineNum = w.location.match(/(\d+)/)?.[0];
                    const shelfNum = shelfName.match(/(\d+)/)?.[0];
                    if (wineNum && shelfNum && wineNum === shelfNum) return true;
                    // Handle Hors Cave mismatch
                    if ((w.location === 'Hors cave' || w.location === 'Off-site') && (shelfName === 'Hors cave' || shelfName === 'Off-site')) return true;
                    
                    return false;
                });

                if (shelfWines.length === 0 && shelfName !== 'Hors cave' && shelfName !== 'Off-site') return null;
                if (shelfWines.length === 0) return null;

                const isExpanded = expandedShelves[shelfName] || false;

                return (
                    <div key={shelfName} className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-100/80 dark:border-stone-800 overflow-hidden transition-colors">
                        <button 
                          onClick={() => toggleShelf(shelfName)}
                          className={`w-full p-5 flex justify-between items-center transition-colors ${isExpanded ? 'bg-stone-50 dark:bg-stone-800 border-b border-stone-100 dark:border-stone-800' : 'bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
                        >
                            <div className="flex items-center gap-3">
                              <div className="text-stone-400 dark:text-stone-500">
                                {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                              </div>
                              <h2 className={`font-bold text-gray-800 dark:text-gray-100 ${fontClasses.shelfTitle}`}>
                                  {shelfName}
                              </h2>
                            </div>
                            <span className={`bg-gray-100 dark:bg-stone-800 text-gray-500 dark:text-stone-400 font-semibold px-2.5 py-1 rounded-full border border-gray-200 dark:border-stone-700 ${fontClasses.shelfCount}`}>
                                {shelfWines.reduce((acc, w) => acc + w.quantity, 0)}
                            </span>
                        </button>
                        
                        {isExpanded && (
                          <div className="p-5 pt-3 space-y-3 animate-in slide-in-from-top-2 fade-in duration-200">
                              {shelfWines.map(wine => (
                                  <div 
                                      key={wine.id} 
                                      onClick={() => { setSelectedWine(wine); setView('detail'); }}
                                      className={`flex gap-4 items-center p-3 rounded-xl cursor-pointer transition-all shadow-sm border-l-4 ${getColorTheme(wine.color)}`}
                                  >
                                      <div className="w-14 h-14 rounded-full bg-white dark:bg-stone-800 flex-shrink-0 overflow-hidden border-2 border-white dark:border-stone-700 shadow-sm relative">
                                          {wine.image ? <img src={wine.image} className="w-full h-full object-cover" alt="" /> : <WineIcon className="w-6 h-6 m-auto mt-3.5 text-stone-300 dark:text-stone-600"/>}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                          <p className={`font-bold text-gray-800 dark:text-gray-100 truncate ${fontClasses.title}`}>{wine.name}</p>
                                          <div className={`flex items-center gap-2 mt-0.5`}>
                                            <p className={`text-gray-500 dark:text-gray-400 truncate ${fontClasses.sub}`}>{wine.region} - {wine.year}</p>
                                            <div className={`w-2 h-2 rounded-full ${getConsumptionStatusColor(wine)} flex-shrink-0`}></div>
                                          </div>
                                      </div>
                                      <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg shadow-sm ${getQuantityBadgeStyle(wine.color)}`}>
                                          <span className={`uppercase font-bold opacity-60 leading-none ${fontClasses.badgeLabel}`}>Qté</span>
                                          <span className={`font-bold leading-none mt-0.5 ${fontClasses.badgeValue}`}>{wine.quantity}</span>
                                      </div>
                                  </div>
                              ))}
                          </div>
                        )}
                    </div>
                );
            })}
        </div>
      );
    }

    if (activeTab === 'history') {
      const displayedHistory = filteredHistory;

      return (
        <div className="pb-24 p-4">
             <div className="flex justify-between items-center mb-6 px-2 pt-2">
                <h1 className="text-3xl font-serif font-bold text-stone-800 dark:text-stone-100">{t('history')}</h1>
                <div className="flex gap-2">
                    <button 
                    onClick={() => setIsSearchOpen(true)}
                    className={`p-2 rounded-full transition-all ${isFiltering ? 'bg-rose-100 dark:bg-rose-900 text-rose-900 dark:text-rose-100 shadow-sm' : 'bg-white dark:bg-stone-800 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 shadow-sm'}`}
                    >
                    {isFiltering ? <div className="relative"><Search size={24} /><div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-600 rounded-full border border-white"></div></div> : <Search size={24} />}
                    </button>
                    <button 
                      onClick={() => setIsInfoOpen(true)}
                      className="p-2 rounded-full bg-white dark:bg-stone-800 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 shadow-sm transition-all"
                    >
                      <Info size={24} />
                    </button>
                    <button 
                      onClick={() => setIsSettingsOpen(true)}
                      className="p-2 rounded-full bg-white dark:bg-stone-800 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 shadow-sm transition-all"
                    >
                      <SettingsIcon size={24} />
                    </button>
                </div>
             </div>

             {renderStatsBar(displayedHistory)}

             {isFiltering && (
              <div className="bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-3 flex justify-between items-center text-sm text-stone-800 dark:text-stone-200 mb-4">
                <span>{t('active_filters')} ({displayedHistory.length})</span>
                <button onClick={() => setSearchFilters({})} className="flex items-center gap-1 font-semibold text-xs bg-white dark:bg-stone-700 px-2 py-1 rounded shadow-sm border border-stone-200 dark:border-stone-600 text-stone-800 dark:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-600">
                  <XCircle size={14}/> Effacer
                </button>
              </div>
            )}

             {displayedHistory.length === 0 ? (
                 <div className="text-center py-20 text-stone-400 dark:text-stone-600 flex flex-col items-center">
                    <div className="w-20 h-20 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mb-4">
                      {isFiltering ? <Search size={40} className="opacity-40"/> : <History size={40} className="opacity-40"/>}
                    </div>
                    <p>{isFiltering ? t('no_results') : t('empty_history')}</p>
                </div>
             ) : (
                <div className="space-y-3">
                    {displayedHistory.map((entry, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => { setSelectedWine(entry); setView('detail'); }}
                            className={`flex gap-4 p-3 rounded-xl cursor-pointer transition-all shadow-sm border-l-4 ${getColorTheme(entry.color)}`}
                        >
                            <div className="w-16 h-16 rounded-xl bg-white dark:bg-stone-800 flex-shrink-0 overflow-hidden border border-stone-200 dark:border-stone-700">
                                {entry.image ? <img src={entry.image} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-stone-300 dark:text-stone-600"><WineIcon/></div>}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className={`font-bold text-stone-800 dark:text-stone-100 ${fontClasses.title}`}>{entry.name}</h3>
                                    <div className="flex items-center gap-0.5 text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-md border border-amber-100 dark:border-amber-900/30 shadow-sm">
                                        <span className={`font-bold text-amber-600 dark:text-amber-400 ${fontClasses.badgeValue}`}>{entry.consumptionRating}</span>
                                        <span className={`${fontClasses.badgeLabel} text-amber-500`}>★</span>
                                    </div>
                                </div>
                                <p className={`text-stone-600 dark:text-stone-400 font-medium ${fontClasses.sub}`}>{entry.appellation} - {entry.year}</p>
                                <div className="flex items-center justify-between mt-2">
                                  <p className={`text-stone-400 dark:text-stone-500 ${fontClasses.sub}`}>{t('consumed_on')} {new Date(entry.consumedDate).toLocaleDateString()}</p>
                                  <div className={`bg-white/50 dark:bg-stone-800 px-2 py-0.5 rounded text-stone-600 dark:text-stone-400 font-semibold border border-stone-200/50 dark:border-stone-700 ${fontClasses.badgeLabel}`}>
                                      {t('total_drunk')}: {entry.quantity}
                                  </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
             )}
        </div>
      );
    }
  };

  return (
    <>
      <div className={settings.theme === 'dark' ? 'dark' : ''}>
          {/* Global Container - Center on Desktop, Full on Mobile */}
          <div className="bg-stone-200 dark:bg-stone-950 h-screen w-full flex justify-center overflow-hidden">
          
          {/* Splash Screen */}
          {showSplash && (
            <div className={`absolute inset-0 z-[100] flex flex-col items-center justify-start pt-24 bg-black transition-opacity duration-1000 ease-in-out ${splashFading ? 'opacity-0' : 'opacity-100'}`}>
                {/* Image de fond */}
                <div className="absolute inset-0 z-0">
                    <img 
                        src={SPLASH_IMAGE_URL} 
                        alt="Splash Screen" 
                        className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-black/50" />
                </div>
                {/* Texte */}
                <h1 className="relative z-10 text-5xl md:text-6xl font-serif font-bold text-red-600 text-center drop-shadow-2xl px-4 tracking-wider">
                    Ma Cave à Vin
                </h1>
            </div>
          )}

          {/* Main App Frame */}
          <main className="w-full max-w-md h-full bg-stone-50 dark:bg-black shadow-2xl relative flex flex-col transition-colors duration-300">
              
              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto no-scrollbar relative">
                {renderContent()}
              </div>

              {/* Floating Add Button - Absolute to Frame */}
              {view === 'list' && activeTab === 'cellar' && (
              <button
                  onClick={() => setView('add')}
                  className="absolute bottom-24 right-6 bg-rose-900 dark:bg-rose-700 text-white p-4 rounded-full shadow-lg shadow-rose-900/30 dark:shadow-rose-900/50 hover:bg-rose-800 dark:hover:bg-rose-600 transition-transform hover:scale-105 active:scale-95 z-30"
              >
                  <Plus size={28} />
              </button>
              )}

              {/* Bottom Navigation - Absolute to Frame */}
              {view === 'list' && (
              <div className="absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 z-40 safe-area-bottom transition-colors duration-300">
                  <div className="flex justify-around items-center h-20 pb-2">
                  <button
                      onClick={() => { setActiveTab('cellar'); setView('list'); }}
                      className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeTab === 'cellar' ? 'text-rose-900 dark:text-rose-400' : 'text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400'}`}
                  >
                      <div className={`p-1 rounded-xl mb-1 ${activeTab === 'cellar' ? 'bg-rose-50 dark:bg-rose-900/20' : ''}`}>
                      <LayoutGrid size={24} strokeWidth={activeTab === 'cellar' ? 2.5 : 2} />
                      </div>
                      <span className="text-xs font-semibold">{t('cellar')}</span>
                  </button>

                  <button
                      onClick={() => { setActiveTab('stats'); setView('list'); }}
                      className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeTab === 'stats' ? 'text-rose-900 dark:text-rose-400' : 'text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400'}`}
                  >
                      <div className={`p-1 rounded-xl mb-1 ${activeTab === 'stats' ? 'bg-rose-50 dark:bg-rose-900/20' : ''}`}>
                      <PieChart size={24} strokeWidth={activeTab === 'stats' ? 2.5 : 2} />
                      </div>
                      <span className="text-xs font-semibold">{t('stats')}</span>
                  </button>

                  <button
                      onClick={() => { setActiveTab('history'); setView('list'); }}
                      className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeTab === 'history' ? 'text-rose-900 dark:text-rose-400' : 'text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400'}`}
                  >
                      <div className={`p-1 rounded-xl mb-1 ${activeTab === 'history' ? 'bg-rose-50 dark:bg-rose-900/20' : ''}`}>
                          <History size={24} strokeWidth={activeTab === 'history' ? 2.5 : 2} />
                      </div>
                      <span className="text-xs font-semibold">{t('history')}</span>
                  </button>
                  </div>
              </div>
              )}
          </main>

          <SearchModal 
              isOpen={isSearchOpen} 
              onClose={() => setIsSearchOpen(false)} 
              onSearch={setSearchFilters}
              currentFilters={searchFilters}
              onReset={() => setSearchFilters({})}
              language={settings.language}
          />

          <SettingsModal 
              isOpen={isSettingsOpen} 
              onClose={() => setIsSettingsOpen(false)}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onExport={handleExport}
              onImport={handleImport}
          />

          {/* Info Modal */}
          {isInfoOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div 
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setIsInfoOpen(false)}
                />
                <div className="relative bg-white dark:bg-stone-900 rounded-2xl w-full max-w-xs p-6 shadow-2xl transition-colors border border-stone-100 dark:border-stone-800 text-center animate-in zoom-in-95 duration-200">
                    <div className="w-12 h-12 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Info size={24} />
                    </div>
                    
                    <div className="space-y-3 mb-6">
                        <p className="text-stone-800 dark:text-stone-200 font-medium">
                            Application développée par <strong>Cheeser92</strong>
                        </p>
                        <p className="text-stone-500 dark:text-stone-400 text-sm">
                            Tous droits réservés.
                        </p>
                        <div className="w-8 h-1 bg-rose-900/10 dark:bg-rose-500/20 rounded-full mx-auto my-3"></div>
                        <p className="text-stone-400 dark:text-stone-500 text-xs font-mono uppercase tracking-widest">
                            Version 1.0
                        </p>
                        <p className="text-stone-400 dark:text-stone-500 text-xs">
                            2025
                        </p>
                    </div>

                    <button 
                        onClick={() => setIsInfoOpen(false)}
                        className="w-full py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold text-sm hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                    >
                        Fermer
                    </button>
                </div>
            </div>
          )}
          </div>
      </div>
    </>
  );
}

export default App;