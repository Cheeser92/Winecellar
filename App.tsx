
import React, { useState, useEffect } from 'react';
import { Plus, LayoutGrid, History, Wine as WineIcon, Search, XCircle, ChevronDown, ChevronRight, Calculator, Coins, Hash, PieChart, Settings as SettingsIcon, Info } from 'lucide-react';
import { Wine, HistoryEntry, WineColor, SearchFilters, AppSettings, LOCATION_HORS_CAVE, BackupData, AppFontSize } from './types';
import { WineForm } from './components/WineForm';
import { WineDetail } from './components/WineDetail';
import { SearchModal } from './components/SearchModal';
import { StatsView } from './components/StatsView';
import { SettingsModal } from './components/SettingsModal';
import { InfoModal } from './components/InfoModal';
import { getTranslation } from './translations';

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
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('my-wine-cellar-settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
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

  // Handle Shelf Logic when settings change
  const handleUpdateSettings = (newSettings: AppSettings) => {
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

  // Improved Export Logic
  const handleExport = async () => {
    const backup: BackupData = {
      wines,
      history,
      settings,
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

  const handleAddWine = (wineData: Omit<Wine, 'id'>) => {
    const newWine: Wine = { ...wineData, id: Date.now().toString() };
    setWines(prev => [...prev, newWine]);
    setView('list');
    setActiveTab('cellar');
  };

  const handleEditWine = (wineData: Omit<Wine, 'id'>) => {
    if (selectedWine && 'id' in selectedWine) {
        if (activeTab === 'history') {
            // Update history entry with all form data
            setHistory(prev => prev.map(h => h.id === selectedWine.id ? { ...h, ...wineData } : h));
            setSelectedWine(prev => prev ? { ...prev, ...wineData } : null);
        } else {
            // Update current stock
            const updatedWine = { ...wineData, id: selectedWine.id } as Wine;
            setWines(prev => prev.map(w => w.id === selectedWine.id ? updatedWine : w));
            setSelectedWine(updatedWine);
        }
        setView('detail');
    }
  };

  const handleUpdateWineImage = (id: string, image: string, isHistory: boolean) => {
    if (isHistory) {
      setHistory(prev => prev.map(h => h.id === id ? { ...h, image } : h));
    } else {
      setWines(prev => prev.map(w => w.id === id ? { ...w, image } : w));
    }
    // Sync UI selection if necessary
    if (selectedWine && selectedWine.id === id) {
      setSelectedWine(prev => prev ? { ...prev, image } : null);
    }
  };

  const handleDuplicateWine = (sourceWine: Wine, quantity: number, location: string) => {
      const { id, ...wineProps } = sourceWine;
      const newWine: Wine = {
        ...wineProps as Wine,
        id: Date.now().toString(),
        quantity: quantity,
        location: location,
        purchaseDate: sourceWine.purchaseDate || new Date().toISOString(),
      };
      if ('consumedDate' in newWine) delete (newWine as any).consumedDate;
      if ('consumptionRating' in newWine) delete (newWine as any).consumptionRating;

      setWines(prev => [...prev, newWine]);
      setActiveTab('cellar');
      setView('list');
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
    if (existingHistoryIndex >= 0) {
        newHistory = [...history];
        newHistory[existingHistoryIndex] = {
            ...newHistory[existingHistoryIndex],
            quantity: newHistory[existingHistoryIndex].quantity + 1,
            consumptionRating: rating,
            strength: strength,
            consumedDate: new Date().toISOString()
        };
    } else {
        const historyEntry: HistoryEntry = {
          ...wine,
          strength: strength,
          consumedDate: new Date().toISOString(),
          consumptionRating: rating,
          quantity: 1
        };
        newHistory = [...history, historyEntry];
    }
    setHistory(newHistory);
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
        return 'border-l-rose-700 bg-rose-100/50 hover:bg-rose-200/50 dark:bg-rose-900/40 dark:hover:bg-rose-900/60 dark:border-l-rose-600';
      case WineColor.BLANC:
        return 'border-l-yellow-500 bg-yellow-100/50 hover:bg-yellow-200/50 dark:bg-yellow-900/40 dark:hover:bg-yellow-900/60 dark:border-l-yellow-400';
      case WineColor.ROSE:
        return 'border-l-pink-500 bg-pink-100/50 hover:bg-pink-200/50 dark:bg-pink-900/40 dark:hover:bg-pink-900/60 dark:border-l-pink-400';
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
      <div className="grid grid-cols-3 gap-1.5 mb-4">
        <div className="bg-white dark:bg-stone-800 p-2 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 flex flex-col items-center justify-center transition-colors">
            <div className="flex items-center gap-1 text-stone-400 dark:text-stone-500 mb-0.5">
               <Hash size={10}/>
               <span className="text-[9px] uppercase font-bold tracking-wide">{t('bottles')}</span>
            </div>
            <p className="text-base font-bold text-stone-800 dark:text-stone-100 leading-tight">{totalBottles}</p>
        </div>
        <div className="bg-white dark:bg-stone-800 p-2 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 flex flex-col items-center justify-center transition-colors">
             <div className="flex items-center gap-1 text-stone-400 dark:text-stone-500 mb-0.5">
               <Coins size={10}/>
               <span className="text-[9px] uppercase font-bold tracking-wide">{t('total_cost')}</span>
            </div>
            <p className="text-base font-bold text-stone-800 dark:text-stone-100 leading-tight">{totalCost.toLocaleString(settings.language, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-white dark:bg-stone-800 p-2 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 flex flex-col items-center justify-center transition-colors">
            <div className="flex items-center gap-1 text-stone-400 dark:text-stone-500 mb-0.5">
               <Calculator size={10}/>
               <span className="text-[9px] uppercase font-bold tracking-wide">{t('avg_price')}</span>
            </div>
            <p className="text-base font-bold text-stone-800 dark:text-stone-100 leading-tight">{avgPrice.toLocaleString(settings.language, { style: 'currency', currency: 'EUR', maximumFractionDigits: 1 })}</p>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (view === 'add') return <WineForm onSave={handleAddWine} onCancel={() => setView('list')} availableLocations={availableLocations} language={settings.language} />;
    if (view === 'edit' && selectedWine) return <WineForm initialData={selectedWine} onSave={handleEditWine} onCancel={() => setView('detail')} availableLocations={availableLocations} language={settings.language} isHistoryMode={activeTab === 'history'} />;
    if (view === 'detail' && selectedWine) return <WineDetail wine={selectedWine} onBack={() => setView('list')} onConsume={activeTab === 'history' ? undefined : handleConsumeWine} onDelete={activeTab === 'history' ? handleDeleteHistory : handleDeleteWine} onEdit={() => setView('edit')} onDuplicate={handleDuplicateWine} onUpdateImage={(img) => handleUpdateWineImage(selectedWine.id, img, activeTab === 'history')} availableLocations={availableLocations} isHistory={activeTab === 'history'} language={settings.language} fontSize={settings.fontSize} />;
    if (activeTab === 'stats') return <StatsView wines={wines} history={history} language={settings.language} theme={settings.theme} />;

    if (activeTab === 'cellar') {
      return (
        <div className="pb-24 px-2 py-4 space-y-3">
            <div className="flex justify-between items-center mb-1 px-1">
                <h1 className="text-2xl font-serif font-bold text-rose-950 dark:text-rose-100">{t('app_title')}</h1>
                <div className="flex gap-2">
                    <button onClick={() => setIsSearchOpen(true)} className={`p-2 rounded-full transition-all ${isFiltering ? 'bg-rose-100 dark:bg-rose-900 text-rose-900 dark:text-rose-100 shadow-sm' : 'bg-white dark:bg-stone-800 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 shadow-sm'}`}><Search size={22} /></button>
                    <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full bg-white dark:bg-stone-800 text-stone-400 dark:text-stone-500 shadow-sm"><SettingsIcon size={22} /></button>
                    <button onClick={() => setIsInfoOpen(true)} className="p-2 rounded-full bg-white dark:bg-stone-800 text-stone-400 dark:text-stone-500 shadow-sm"><Info size={22} /></button>
                </div>
            </div>
            {renderStatsBar(filteredWines)}
            {filteredWines.length === 0 && <div className="text-center py-20 text-stone-400 dark:text-stone-600 flex flex-col items-center"><div className="w-20 h-20 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mb-4"><WineIcon size={40} className="opacity-40"/></div><p>{t('empty_cellar')}</p></div>}
            {availableLocations.map(shelfName => {
                const shelfWines = filteredWines.filter(w => w.location === shelfName);
                if (shelfWines.length === 0) return null;
                const isExpanded = expandedShelves[shelfName] || false;
                return (
                    <div key={shelfName} className="bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-100/80 dark:border-stone-800 overflow-hidden">
                        <button onClick={() => toggleShelf(shelfName)} className={`w-full p-4 flex justify-between items-center ${isExpanded ? 'bg-stone-50 dark:bg-stone-800 border-b border-stone-100 dark:border-stone-800' : ''}`}><div className="flex items-center gap-2.5"><div className="text-stone-400">{isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</div><h2 className={`font-bold text-gray-800 dark:text-gray-100 ${fontClasses.shelfTitle}`}>{shelfName}</h2></div><span className={`bg-gray-100 dark:bg-stone-800 text-gray-500 dark:text-stone-400 font-semibold px-2 py-0.5 rounded-full border border-gray-200 dark:border-stone-700 ${fontClasses.shelfCount}`}>{shelfWines.reduce((acc, w) => acc + w.quantity, 0)}</span></button>
                        {isExpanded && <div className="p-2 space-y-2">
                              {shelfWines.map(wine => (
                                  <div key={wine.id} onClick={() => { setSelectedWine(wine); setView('detail'); }} className={`flex gap-2.5 items-center p-2 rounded-lg cursor-pointer transition-all shadow-sm border-l-4 ${getColorTheme(wine.color)}`}>
                                      <div className="w-12 h-12 rounded-full bg-white dark:bg-stone-800 flex-shrink-0 overflow-hidden border border-white dark:border-stone-700 shadow-sm relative">{wine.image ? <img src={wine.image} className="w-full h-full object-cover" alt="" /> : <WineIcon className="w-5 h-5 m-auto mt-3.5 text-stone-300 dark:text-stone-600"/>}</div>
                                      <div className="flex-1 min-w-0"><p className={`font-bold text-gray-800 dark:text-gray-100 truncate ${fontClasses.title} leading-tight`}>{wine.name}</p><div className="flex items-center gap-1.5 mt-0.5"><p className={`text-gray-500 dark:text-gray-400 truncate ${fontClasses.sub}`}>{wine.region} - {wine.year}</p><div className={`w-1.5 h-1.5 rounded-full ${getConsumptionStatusColor(wine)} flex-shrink-0`}></div></div></div>
                                      <div className={`flex flex-col items-center justify-center w-9 h-9 rounded shadow-sm ${getQuantityBadgeStyle(wine.color)} flex-shrink-0`}><span className={`uppercase font-bold opacity-60 leading-none ${fontClasses.badgeLabel}`}>Qté</span><span className={`font-bold leading-none mt-0.5 ${fontClasses.badgeValue}`}>{wine.quantity}</span></div>
                                  </div>
                              ))}
                          </div>}
                    </div>
                );
            })}
        </div>
      );
    }

    if (activeTab === 'history') {
      return (
        <div className="pb-24 px-2 py-4">
             <div className="flex justify-between items-center mb-4 px-1">
                <h1 className="text-2xl font-serif font-bold text-stone-800 dark:text-stone-100">{t('history')}</h1>
                <button onClick={() => setIsInfoOpen(true)} className="p-2 rounded-full bg-white dark:bg-stone-800 text-stone-400 dark:text-stone-500 shadow-sm"><Info size={22} /></button>
             </div>
             {renderStatsBar(filteredHistory)}
             {filteredHistory.length === 0 ? <div className="text-center py-20 text-stone-400 flex flex-col items-center"><History size={40} className="opacity-40 mb-4"/><p>{t('empty_history')}</p></div> : (
                <div className="space-y-3">
                    {filteredHistory.map((entry, idx) => (
                        <div key={idx} onClick={() => { setSelectedWine(entry); setView('detail'); }} className={`flex gap-3 p-2.5 rounded-xl cursor-pointer shadow-sm border-l-4 ${getColorTheme(entry.color)}`}>
                            <div className="w-12 h-12 rounded-lg bg-white dark:bg-stone-800 flex-shrink-0 overflow-hidden border border-stone-200 dark:border-stone-700">{entry.image ? <img src={entry.image} className="w-full h-full object-cover" alt="" /> : <WineIcon className="w-full h-full p-3 text-stone-300"/>}</div>
                            <div className="flex-1 min-w-0"><div className="flex justify-between items-start"><h3 className={`font-bold text-stone-800 dark:text-stone-100 truncate pr-2 ${fontClasses.title} leading-tight`}>{entry.name}</h3><div className="flex items-center gap-0.5 text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1 py-0.5 rounded border border-amber-100 dark:border-amber-900/30 shadow-sm flex-shrink-0"><span className={`font-bold text-amber-600 dark:text-amber-400 ${fontClasses.badgeValue}`}>{entry.consumptionRating}</span><span className="text-amber-500 text-[9px]">★</span></div></div><p className={`text-stone-600 dark:text-stone-400 font-medium ${fontClasses.sub} truncate`}>{entry.appellation} - {entry.year}</p><div className="flex items-center justify-between mt-1"><p className={`text-stone-400 dark:text-stone-500 ${fontClasses.sub}`}>{t('consumed_on')} {new Date(entry.consumedDate).toLocaleDateString()}</p><div className={`bg-white/50 dark:bg-stone-800 px-1.5 py-0.5 rounded text-stone-600 dark:text-stone-400 font-semibold border border-stone-200/50 dark:border-stone-700 ${fontClasses.badgeLabel}`}>{t('total_drunk')}: {entry.quantity}</div></div></div>
                        </div>
                    ))}
                </div>
             )}
        </div>
      );
    }
  };

  return (
    <div className={settings.theme === 'dark' ? 'dark' : ''}>
      <div className="bg-stone-200 dark:bg-stone-950 h-screen w-full flex justify-center overflow-hidden">
        <main className="w-full max-w-md h-full bg-stone-50 dark:bg-black shadow-2xl relative flex flex-col transition-colors duration-300">
          <div className="flex-1 overflow-y-auto no-scrollbar relative">{renderContent()}</div>
          {view === 'list' && activeTab === 'cellar' && (
            <button onClick={() => setView('add')} className="absolute bottom-24 right-6 bg-rose-900 dark:bg-rose-700 text-white p-4 rounded-full shadow-lg shadow-rose-900/30 hover:scale-105 active:scale-95 z-30"><Plus size={28} /></button>
          )}
          {view === 'list' && (
            <div className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 z-40 safe-area-bottom">
              <div className="flex justify-around items-center h-20 pb-2">
                <button onClick={() => { setActiveTab('cellar'); setView('list'); }} className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'cellar' ? 'text-rose-900 dark:text-rose-400' : 'text-stone-400'}`}><LayoutGrid size={24} /><span className="text-xs font-semibold">{t('cellar')}</span></button>
                <button onClick={() => { setActiveTab('stats'); setView('list'); }} className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'stats' ? 'text-rose-900 dark:text-rose-400' : 'text-stone-400'}`}><PieChart size={24} /><span className="text-xs font-semibold">{t('stats')}</span></button>
                <button onClick={() => { setActiveTab('history'); setView('list'); }} className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'history' ? 'text-rose-900 dark:text-rose-400' : 'text-stone-400'}`}><History size={24} /><span className="text-xs font-semibold">{t('history')}</span></button>
              </div>
            </div>
          )}
        </main>
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onSearch={setSearchFilters} currentFilters={searchFilters} onReset={() => setSearchFilters({})} language={settings.language} />
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} onUpdateSettings={handleUpdateSettings} onExport={handleExport} onImport={handleImport} />
        <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
      </div>
    </div>
  );
}

export default App;
