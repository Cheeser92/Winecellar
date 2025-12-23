
import React, { useState, useEffect, useRef } from 'react';
import { X, Moon, Sun, Languages, Library, Check, Download, Upload, Database, AlertTriangle, Type } from 'lucide-react';
import { AppSettings, Language, Theme, BackupData, AppFontSize } from '../types';
import { getTranslation } from '../translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onExport: () => void;
  onImport: (data: BackupData) => void;
}

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
        if (json && Array.isArray(json.wines) && Array.isArray(json.history) && json.settings) {
            setPendingImportData(json as BackupData);
            setShowImportModal(true);
        } else {
            alert(t('import_error'));
        }
      } catch (err) {
        console.error(err);
        alert(t('import_error'));
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-stone-50 dark:bg-stone-900 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden transition-colors duration-300 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-800 flex-shrink-0">
          <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">{t('settings')}</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 bg-stone-100 dark:bg-stone-800 p-2 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-8 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="p-2.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">{localSettings.theme === 'dark' ? <Moon size={20}/> : <Sun size={20}/>}</div><span className="font-bold text-stone-800 dark:text-stone-200">{t('theme')}</span></div>
            <button onClick={() => setLocalSettings(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }))} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${localSettings.theme === 'dark' ? 'bg-indigo-600' : 'bg-stone-200'}`}><span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${localSettings.theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} /></button>
          </div>
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3"><div className="p-2.5 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"><Languages size={20}/></div><span className="font-bold text-stone-800 dark:text-stone-200">{t('language')}</span></div>
            <select value={localSettings.language} onChange={(e) => setLocalSettings(prev => ({ ...prev, language: e.target.value as Language }))} className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 text-sm rounded-lg focus:ring-rose-500 focus:border-rose-500 block p-2.5"><option value="fr">Français</option><option value="en">English</option></select>
          </div>
          <div className="space-y-3">
             <div className="flex items-center gap-3"><div className="p-2.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"><Type size={20}/></div><span className="font-bold text-stone-800 dark:text-stone-200">{t('font_size')}</span></div>
            <div className="flex gap-2 p-1 bg-white dark:bg-stone-800/50 rounded-xl border border-stone-100 dark:border-stone-800">
                <button onClick={() => setFontSize('small')} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${localSettings.fontSize === 'small' ? 'bg-stone-100 dark:bg-stone-700 shadow-sm text-rose-900 dark:text-white' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50/50 dark:hover:bg-stone-700/50'}`}>{t('font_small')}</button>
                <button onClick={() => setFontSize('medium')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${(!localSettings.fontSize || localSettings.fontSize === 'medium') ? 'bg-stone-100 dark:bg-stone-700 shadow-sm text-rose-900 dark:text-white' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50/50 dark:hover:bg-stone-700/50'}`}>{t('font_medium')}</button>
                <button onClick={() => setFontSize('large')} className={`flex-1 py-2 text-base font-semibold rounded-lg transition-all ${localSettings.fontSize === 'large' ? 'bg-stone-100 dark:bg-stone-700 shadow-sm text-rose-900 dark:text-white' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50/50 dark:hover:bg-stone-700/50'}`}>{t('font_large')}</button>
            </div>
          </div>
          <div className="space-y-3">
             <div className="flex items-center gap-3"><div className="p-2.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"><Library size={20}/></div><span className="font-bold text-stone-800 dark:text-stone-200">{t('shelf_count')}</span></div>
            <div className="flex items-center gap-4 bg-white dark:bg-stone-800/50 p-4 rounded-xl border border-stone-100 dark:border-stone-800"><input type="range" min="0" max="10" value={localSettings.shelfCount} onChange={handleShelfChange} className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-rose-900 dark:accent-rose-500"/><div className="w-12 h-10 flex items-center justify-center bg-white dark:bg-stone-700 rounded-lg shadow-sm border border-stone-200 dark:border-stone-600 font-bold text-stone-800 dark:text-stone-100">{localSettings.shelfCount}</div></div>
            <p className="text-xs text-stone-500 dark:text-stone-400 px-1 leading-relaxed">{t('shelf_count_desc')}</p>
          </div>
           <div className="space-y-3 pt-4 border-t border-stone-100 dark:border-stone-800">
             <div className="flex items-center gap-3"><div className="p-2.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"><Database size={20}/></div><span className="font-bold text-stone-800 dark:text-stone-200">{t('backup')}</span></div>
            <div className="grid grid-cols-2 gap-3"><button onClick={onExport} className="flex items-center justify-center gap-2 p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition"><Download size={18} /><span className="text-sm font-semibold">{t('export_data')}</span></button><button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition"><Upload size={18} /><span className="text-sm font-semibold">{t('import_data')}</span></button><input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" /></div>
          </div>
        </div>
        <div className="p-4 border-t border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-b-2xl flex-shrink-0"><button onClick={handleConfirm} className="w-full flex items-center justify-center gap-2 bg-rose-900 dark:bg-rose-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-rose-800 dark:hover:bg-rose-600 transition active:scale-95"><Check size={20} />{t('confirm')}</button></div>
      </div>
       {showImportModal && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowImportModal(false)}/><div className="relative bg-stone-50 dark:bg-stone-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl transition-colors border border-stone-100 dark:border-stone-800"><div className="flex items-center gap-3 mb-4 text-amber-600 dark:text-amber-500"><AlertTriangle size={24} /><h3 className="text-xl font-bold text-stone-900 dark:text-white">{t('confirm')}</h3></div><p className="text-stone-600 dark:text-stone-300 mb-8 leading-relaxed">{t('import_warning')}</p><div className="flex gap-3"><button onClick={() => setShowImportModal(false)} className="flex-1 py-3 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-medium hover:bg-stone-50 dark:hover:bg-stone-800 transition">{t('cancel')}</button><button onClick={confirmImport} className="flex-1 py-3 rounded-xl bg-rose-900 dark:bg-rose-700 text-white font-bold hover:bg-rose-800 dark:hover:bg-rose-600 shadow-lg shadow-rose-900/20 transition">{t('confirm')}</button></div></div>
        </div>
      )}
    </div>
  );
};
