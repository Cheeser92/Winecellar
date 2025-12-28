
import React, { useState, useEffect, useRef } from 'react';
import { X, Moon, Sun, Languages, Library, Check, Download, Upload, Database, AlertTriangle, Type, Info, Palette } from 'lucide-react';
import { AppSettings, Language, Theme, BackupData, AppFontSize, ColorTheme } from '../types';
import { getTranslation } from '../translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onExport: () => void;
  onImport: (data: BackupData) => void;
  fontSize?: AppFontSize;
}

const COLOR_THEMES: { id: ColorTheme; hex: string }[] = [
  { id: 'default', hex: '#881337' },
  { id: 'blue', hex: '#60a5fa' },
  { id: 'red', hex: '#f87171' },
  { id: 'yellow', hex: '#fbbf24' },
  { id: 'mauve', hex: '#a78bfa' },
  { id: 'green', hex: '#34d399' }
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdateSettings, onExport, onImport }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [showImportModal, setShowImportModal] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<BackupData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const t = (key: any) => getTranslation(localSettings.language, key);

  const handleShelfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(0, Math.min(10, parseInt(e.target.value) || 0));
    setLocalSettings(prev => ({ ...prev, shelfCount: val }));
  };

  const handleConfirm = () => {
    onUpdateSettings(localSettings);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const json = JSON.parse(result);
        
        // Validation plus stricte de la structure du backup
        if (json && Array.isArray(json.cellars) && json.cellars.length > 0) {
            setPendingImportData(json as BackupData);
            setShowImportModal(true);
        } else {
            alert(t('import_error'));
        }
      } catch (err) {
        console.error("Erreur lors du parsing JSON:", err);
        alert(t('import_error'));
      }
      // Reset de l'input pour permettre de ré-importer le même fichier si besoin
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    
    // Correction CRITIQUE : Lire comme du texte et non comme DataURL
    reader.readAsText(file);
  };

  const confirmImport = () => {
    if (pendingImportData) {
        onImport(pendingImportData);
        setShowImportModal(false);
        setPendingImportData(null);
    }
  };

  const setFontSize = (size: AppFontSize) => {
    setLocalSettings(prev => ({ ...prev, fontSize: size }));
  };

  const setColorTheme = (color: ColorTheme) => {
    setLocalSettings(prev => ({ ...prev, colorTheme: color }));
  };

  const getFontSizeClasses = (size: AppFontSize) => {
    switch(size) {
      case 'small': return { base: 'text-xs', label: 'text-[9px]', xl: 'text-base', lg: 'text-sm' };
      case 'large': return { base: 'text-lg', label: 'text-[12px]', xl: 'text-2xl', lg: 'text-xl' };
      case 'medium':
      default: return { base: 'text-sm', label: 'text-[10px]', xl: 'text-lg', lg: 'text-base' };
    }
  };

  const fs = getFontSizeClasses(localSettings.fontSize || 'medium');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-stone-900 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden transition-colors duration-300 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-800 flex-shrink-0">
          <h2 className={`font-serif font-bold text-stone-900 dark:text-stone-100 ${fs.xl}`}>{t('settings')}</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 bg-stone-100 dark:bg-stone-800 p-2 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto no-scrollbar">
          
          <div className="bg-stone-50 dark:bg-stone-800/40 p-3 rounded-xl border border-stone-100 dark:border-stone-800 flex items-start gap-3">
             <Info size={18} className="text-[var(--theme-primary)] dark:text-rose-400 flex-shrink-0 mt-0.5" />
             <p className={`text-stone-500 dark:text-stone-400 leading-tight ${fs.base}`}>{t('settings_scope_desc')}</p>
          </div>

          <section className="space-y-5">
            <h3 className={`font-bold text-[var(--theme-primary)] dark:text-rose-400 uppercase tracking-widest border-b border-stone-100 dark:border-stone-800 pb-2 ${fs.label}`}>{t('global_settings')}</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="p-2.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">{localSettings.theme === 'dark' ? <Moon size={20}/> : <Sun size={20}/>}</div><span className={`font-bold text-stone-800 dark:text-stone-200 ${fs.lg}`}>{t('theme')}</span></div>
              <button onClick={() => setLocalSettings(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }))} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${localSettings.theme === 'dark' ? 'bg-indigo-600' : 'bg-stone-200'}`}><span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${localSettings.theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} /></button>
            </div>

            {localSettings.theme === 'light' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-300">
                <div className="flex items-center gap-3"><div className="p-2.5 rounded-full bg-amber-50 text-amber-600"><Palette size={20}/></div><span className={`font-bold text-stone-800 ${fs.lg}`}>{t('color_theme')}</span></div>
                <div className="flex flex-wrap gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100 justify-between">
                  {COLOR_THEMES.map((theme) => (
                    <button 
                      key={theme.id} 
                      onClick={() => setColorTheme(theme.id)}
                      className="relative w-10 h-10 rounded-lg shadow-sm border border-white active:scale-90 transition-all overflow-hidden"
                      style={{ backgroundColor: theme.hex }}
                    >
                      {(localSettings.colorTheme === theme.id || (!localSettings.colorTheme && theme.id === 'default')) && (
                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                          <Check size={18} className="text-white drop-shadow-md" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3"><div className={`p-2.5 rounded-full bg-[var(--theme-bg-soft)] dark:bg-rose-900/30 text-[var(--theme-primary)] dark:text-rose-400`}><Languages size={20}/></div><span className={`font-bold text-stone-800 dark:text-stone-200 ${fs.lg}`}>{t('language')}</span></div>
              <select value={localSettings.language} onChange={(e) => setLocalSettings(prev => ({ ...prev, language: e.target.value as Language }))} className={`bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 rounded-lg focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)] block p-2 ${fs.base}`}><option value="fr">Français</option><option value="en">English</option></select>
            </div>

            <div className="space-y-3">
               <div className="flex items-center gap-3"><div className="p-2.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"><Type size={20}/></div><span className={`font-bold text-stone-800 dark:text-stone-200 ${fs.lg}`}>{t('font_size')}</span></div>
              <div className="flex gap-2 p-1 bg-white dark:bg-stone-800/50 rounded-xl border border-stone-100 dark:border-stone-800">
                  <button onClick={() => setFontSize('small')} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${localSettings.fontSize === 'small' ? 'bg-stone-100 dark:bg-stone-700 shadow-sm text-[var(--theme-primary)] dark:text-white' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50/50 dark:hover:bg-stone-700/50'}`}>{t('font_small')}</button>
                  <button onClick={() => setFontSize('medium')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${(!localSettings.fontSize || localSettings.fontSize === 'medium') ? 'bg-stone-100 dark:bg-stone-700 shadow-sm text-[var(--theme-primary)] dark:text-white' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50/50 dark:hover:bg-stone-700/50'}`}>{t('font_medium')}</button>
                  <button onClick={() => setFontSize('large')} className={`flex-1 py-2 text-base font-semibold rounded-lg transition-all ${localSettings.fontSize === 'large' ? 'bg-stone-100 dark:bg-stone-700 shadow-sm text-[var(--theme-primary)] dark:text-white' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50/50 dark:hover:bg-stone-700/50'}`}>{t('font_large')}</button>
              </div>
            </div>
          </section>

          <section className="space-y-5 pt-2">
            <h3 className={`font-bold text-[var(--theme-primary)] dark:text-rose-400 uppercase tracking-widest border-b border-stone-100 dark:border-stone-800 pb-2 ${fs.label}`}>{t('cellar_specific_settings')}</h3>
            
            <div className="space-y-3">
               <div className="flex items-center gap-3"><div className="p-2.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"><Library size={20}/></div><span className={`font-bold text-stone-800 dark:text-stone-200 ${fs.lg}`}>{t('shelf_count')}</span></div>
              <div className="flex items-center gap-4 bg-white dark:bg-stone-800/50 p-4 rounded-xl border border-stone-100 dark:border-stone-800"><input type="range" min="0" max="10" value={localSettings.shelfCount} onChange={handleShelfChange} className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-[var(--theme-primary)] dark:accent-rose-500"/><div className={`w-12 h-10 flex items-center justify-center bg-white dark:bg-stone-700 rounded-lg shadow-sm border border-stone-200 dark:border-stone-600 font-bold text-stone-800 dark:text-stone-100 ${fs.lg}`}>{localSettings.shelfCount}</div></div>
              <p className={`text-stone-500 dark:text-stone-400 px-1 leading-relaxed ${fs.base}`}>{t('shelf_count_desc')}</p>
            </div>
          </section>

           <div className="space-y-3 pt-4 border-t border-stone-100 dark:border-stone-800">
             <div className="flex items-center gap-3"><div className="p-2.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"><Database size={20}/></div><span className={`font-bold text-stone-800 dark:text-stone-200 ${fs.lg}`}>{t('backup')}</span></div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={onExport} className="flex items-center justify-center gap-2 p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition">
                <Download size={18} />
                <span className={`font-semibold ${fs.base}`}>{t('export_data')}</span>
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition">
                <Upload size={18} />
                <span className={`font-semibold ${fs.base}`}>{t('import_data')}</span>
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-b-2xl flex-shrink-0"><button onClick={handleConfirm} className={`w-full flex items-center justify-center gap-2 bg-[var(--theme-primary)] dark:bg-[var(--theme-primary-dark)] text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:opacity-90 transition active:scale-95 ${fs.xl}`}><Check size={20} />{t('confirm')}</button></div>
      </div>
       {showImportModal && (
        <div className="absolute inset-0 z-[110] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowImportModal(false)}/><div className="relative bg-white dark:bg-stone-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl transition-colors border border-stone-100 dark:border-stone-800"><div className="flex items-center gap-3 mb-4 text-amber-600 dark:text-amber-500"><AlertTriangle size={24} /><h3 className={`font-bold text-stone-900 dark:text-white ${fs.xl}`}>{t('confirm')}</h3></div><p className={`text-stone-600 dark:text-stone-300 mb-8 leading-relaxed ${fs.base}`}>{t('import_warning')}</p><div className="flex gap-3"><button onClick={() => setShowImportModal(false)} className={`flex-1 py-3 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-medium hover:bg-stone-50 dark:hover:bg-stone-800 transition ${fs.base}`}>{t('cancel')}</button><button onClick={confirmImport} className={`flex-1 py-3 rounded-xl bg-[var(--theme-primary)] dark:bg-[var(--theme-primary-dark)] text-white font-bold hover:opacity-90 shadow-lg transition ${fs.base}`}>{t('confirm')}</button></div></div>
        </div>
      )}
    </div>
  );
};
