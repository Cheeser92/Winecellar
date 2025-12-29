
import React, { useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';
import { Wine, WineColor, Language, Theme, HistoryEntry, AppFontSize } from '../types';
import { getTranslation } from '../translations';
import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';

interface StatsViewProps {
  wines: Wine[];
  history: HistoryEntry[];
  activeCellarName: string;
  onSelectCellar: () => void;
  language: Language;
  theme: Theme;
  fontSize?: AppFontSize;
}

const COLORS_MAP: Record<string, string> = {
  [WineColor.ROUGE]: '#881337', // rose-900
  [WineColor.BLANC]: '#fbbf24', // amber-400
  [WineColor.ROSE]: '#f472b6',  // pink-400
};

const PIE_COLORS = ['#881337', '#be123c', '#fb7185', '#f472b6', '#fbbf24', '#fcd34d', '#4ade80', '#22c55e', '#15803d', '#1e40af', '#3b82f6'];

const ChartContainer = ({ title, children, fontSizeClasses }: { title: string, children?: React.ReactNode, fontSizeClasses: any }) => (
  <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 mb-4 transition-colors">
    <h3 className={`font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wide mb-4 border-b border-stone-100 dark:border-stone-800 pb-2 ${fontSizeClasses.title}`}>{title}</h3>
    <div className="h-64 w-full">
      {children}
    </div>
  </div>
);

export const StatsView: React.FC<StatsViewProps> = ({ wines, history, activeCellarName, onSelectCellar, language, theme, fontSize = 'medium' }) => {
  const t = (key: any) => getTranslation(language, key);
  const isDark = theme === 'dark';

  const [showCellarStats, setShowCellarStats] = useState(true);
  const [showHistoryStats, setShowHistoryStats] = useState(true);

  const getFontSizeClasses = (size: AppFontSize) => {
    switch(size) {
      case 'small':
        return { section: 'text-base', title: 'text-[10px]', tick: 9, label: 9 };
      case 'large':
        return { section: 'text-2xl', title: 'text-base', tick: 13, label: 13 };
      case 'medium':
      default:
        return { section: 'text-lg', title: 'text-sm', tick: 11, label: 11 };
    }
  };

  const fs = getFontSizeClasses(fontSize as AppFontSize);

  // Common render helpers
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
  
    return percent > 0.05 ? (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={fs.label} fontWeight="bold" style={{ textShadow: '0px 0px 3px rgba(0,0,0,0.5)' }}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  const tooltipStyle = {
    backgroundColor: isDark ? '#1c1917' : '#fff',
    borderColor: isDark ? '#292524' : '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    color: isDark ? '#f5f5f4' : '#333',
    fontSize: fs.tick
  };

  // --- CELLAR DATA PROCESSING ---
  const cellarColorData = Object.entries(wines.reduce((acc, wine) => {
    const qty = Number(wine.quantity);
    acc[wine.color] = (acc[wine.color] || 0) + qty;
    return acc;
  }, {} as Record<string, number>)).map(([name, value]) => ({ name: t('color_' + name), value }));

  const processStackedData = (items: Wine[], key: keyof Wine) => {
    const rawData = items.reduce((acc, wine) => {
      const groupKey = String(wine[key]) || t('unknown');
      if (!acc[groupKey]) {
        acc[groupKey] = { name: groupKey, [WineColor.ROUGE]: 0, [WineColor.BLANC]: 0, [WineColor.ROSE]: 0 };
      }
      acc[groupKey][wine.color] += Number(wine.quantity);
      return acc;
    }, {} as Record<string, any>);
    return Object.values(rawData);
  };

  const cellarRegionData = processStackedData(wines, 'region');
  const cellarCountryData = processStackedData(wines, 'country');

  const processCellarYearData = () => {
    const rawData = wines.reduce((acc, wine) => {
      if (!wine.purchaseDate) return acc;
      const year = new Date(wine.purchaseDate).getFullYear().toString();
      if (!acc[year]) {
        acc[year] = { year, [WineColor.ROUGE]: 0, [WineColor.BLANC]: 0, [WineColor.ROSE]: 0 };
      }
      acc[year][wine.color] += Number(wine.quantity);
      return acc;
    }, {} as Record<string, any>);
    return Object.values(rawData).sort((a: any, b: any) => Number(a.year) - Number(b.year));
  };

  const cellarYearData = processCellarYearData();

  // --- HISTORY DATA PROCESSING ---
  const histRegionColorData = processStackedData(history, 'region');

  const getAvgRatingByRegion = (color: string) => {
      const grouped = history
        .filter(h => h.color === color)
        .reduce((acc: Record<string, { sum: number; count: number }>, h) => {
            const region = h.region || t('unknown');
            if (!acc[region]) {
              acc[region] = { sum: 0, count: 0 };
            }
            const qty = Number(h.quantity);
            const entry = acc[region];
            if (entry) {
              entry.sum += h.consumptionRating * qty;
              entry.count += qty;
            }
            return acc;
        }, {} as Record<string, { sum: number; count: number }>);
      
      return Object.entries(grouped).map(([name, val]) => {
          const stats = val as { sum: number, count: number };
          return {
            name,
            rating: stats.count > 0 ? Number((stats.sum / stats.count).toFixed(1)) : 0
          };
      });
  };

  const histAvgRatingRed = getAvgRatingByRegion(WineColor.ROUGE);
  const histAvgRatingWhite = getAvgRatingByRegion(WineColor.BLANC);

  const getPieData = (key: keyof HistoryEntry) => {
      const grouped = history.reduce((acc, h) => {
          const val = String(h[key]) || t('unknown');
          const qty = Number(h.quantity);
          acc[val] = (acc[val] || 0) + qty;
          return acc;
      }, {} as Record<string, number>);
      return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  };

  const histColorData = getPieData('color').map(d => ({ ...d, name: t('color_' + d.name) }));
  const histRegionData = getPieData('region');
  const histYearData = getPieData('year'); 
  const histCountryData = getPieData('country');

  const renderSectionHeader = (title: string, isOpen: boolean, toggle: () => void, onAction?: () => void) => (
    <div className="relative mb-4">
      <button 
          onClick={toggle}
          className="w-full flex items-center justify-between p-4 bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 transition-colors text-left"
      >
          <div className="flex items-center gap-2 pr-12">
            <span className={`font-bold text-rose-950 dark:text-rose-100 ${fs.section}`}>{title}</span>
          </div>
          <div className="text-stone-400 dark:text-stone-500 flex-shrink-0">
              {isOpen ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
          </div>
      </button>
      {onAction && (
        <button 
          onClick={(e) => { e.stopPropagation(); onAction(); }} 
          className="absolute right-14 top-1/2 -translate-y-1/2 p-2.5 text-stone-300 hover:text-rose-900 dark:hover:text-rose-400 transition-all hover:bg-stone-50 dark:hover:bg-stone-800 rounded-full"
        >
          <RefreshCw size={18} />
        </button>
      )}
    </div>
  );

  const legendText = (value: string) => t('color_' + value);

  return (
    <div className="pb-12">
        {renderSectionHeader(`${t('section_cellar_stats')} (${activeCellarName})`, showCellarStats, () => setShowCellarStats(!showCellarStats), onSelectCellar)}
        
        {showCellarStats && (
            <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                {wines.length === 0 ? (
                    <div className={`p-8 text-center text-stone-400 dark:text-stone-600 italic mb-6 ${fs.title}`}>{t('empty_cellar')}</div>
                ) : (
                    <>
                        <ChartContainer title={t('stats_color')} fontSizeClasses={fs}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={cellarColorData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={renderCustomLabel}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {cellarColorData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS_MAP[Object.keys(COLORS_MAP).find(k => t('color_'+k) === entry.name) || ''] || '#ccc'} stroke={isDark ? '#1c1917' : '#fff'}/>
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} itemStyle={{color: isDark ? '#fff' : '#333'}}/>
                                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: fs.tick }}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>

                        <ChartContainer title={t('stats_region')} fontSizeClasses={fs}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={cellarRegionData}
                                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? '#44403c' : '#e5e5e5'}/>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={80} tick={{fontSize: fs.tick, fill: isDark ? '#a8a29e' : '#666'}} interval={0}/>
                                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={tooltipStyle} itemStyle={{color: isDark ? '#fff' : '#333'}}/>
                                    <Legend wrapperStyle={{ fontSize: fs.tick }} formatter={legendText}/>
                                    <Bar dataKey={WineColor.ROUGE} stackId="a" fill={COLORS_MAP[WineColor.ROUGE]} radius={[0, 3, 3, 0]}>
                                      <LabelList dataKey={WineColor.ROUGE} position="center" fill="white" fontSize={fs.label} formatter={(val: number) => val > 0 ? val : ''} />
                                    </Bar>
                                    <Bar dataKey={WineColor.BLANC} stackId="a" fill={COLORS_MAP[WineColor.BLANC]}>
                                      <LabelList dataKey={WineColor.BLANC} position="center" fill="black" fontSize={fs.label} formatter={(val: number) => val > 0 ? val : ''} />
                                    </Bar>
                                    <Bar dataKey={WineColor.ROSE} stackId="a" fill={COLORS_MAP[WineColor.ROSE]}>
                                      <LabelList dataKey={WineColor.ROSE} position="center" fill="white" fontSize={fs.label} formatter={(val: number) => val > 0 ? val : ''} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>

                        <ChartContainer title={t('stats_country')} fontSizeClasses={fs}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={cellarCountryData}
                                    margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#44403c' : '#e5e5e5'}/>
                                    <XAxis dataKey="name" tick={{fontSize: fs.tick, fill: isDark ? '#a8a29e' : '#666'}} interval={0}/>
                                    <YAxis tick={{fontSize: fs.tick, fill: isDark ? '#a8a29e' : '#666'}} allowDecimals={false}/>
                                    <Tooltip cursor={{fill: isDark ? '#292524' : '#f5f5f4'}} contentStyle={tooltipStyle} itemStyle={{color: isDark ? '#fff' : '#333'}}/>
                                    <Legend wrapperStyle={{ fontSize: fs.tick }} formatter={legendText}/>
                                    <Bar dataKey={WineColor.ROUGE} stackId="a" fill={COLORS_MAP[WineColor.ROUGE]} radius={[3, 3, 0, 0]}>
                                      <LabelList dataKey={WineColor.ROUGE} position="center" fill="white" fontSize={fs.label} formatter={(val: number) => val > 0 ? val : ''} />
                                    </Bar>
                                    <Bar dataKey={WineColor.BLANC} stackId="a" fill={COLORS_MAP[WineColor.BLANC]}>
                                      <LabelList dataKey={WineColor.BLANC} position="center" fill="black" fontSize={fs.label} formatter={(val: number) => val > 0 ? val : ''} />
                                    </Bar>
                                    <Bar dataKey={WineColor.ROSE} stackId="a" fill={COLORS_MAP[WineColor.ROSE]}>
                                      <LabelList dataKey={WineColor.ROSE} position="center" fill="white" fontSize={fs.label} formatter={(val: number) => val > 0 ? val : ''} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>

                        <ChartContainer title={t('stats_year')} fontSizeClasses={fs}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={cellarYearData}
                                    margin={{ top: 20, right: 5, left: -20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#44403c' : '#e5e5e5'}/>
                                    <XAxis dataKey="year" tick={{fontSize: fs.tick, fill: isDark ? '#a8a29e' : '#666'}}/>
                                    <YAxis tick={{fontSize: fs.tick, fill: isDark ? '#a8a29e' : '#666'}} allowDecimals={false}/>
                                    <Tooltip cursor={{fill: isDark ? '#292524' : '#f5f5f4'}} contentStyle={tooltipStyle} itemStyle={{color: isDark ? '#fff' : '#333'}}/>
                                    <Legend wrapperStyle={{ fontSize: fs.tick }} formatter={legendText}/>
                                    <Bar dataKey={WineColor.ROUGE} stackId="a" fill={COLORS_MAP[WineColor.ROUGE]} radius={[4, 4, 0, 0]}>
                                      <LabelList dataKey={WineColor.ROUGE} position="center" fill="white" fontSize={fs.label} formatter={(val: number) => val > 0 ? val : ''} />
                                    </Bar>
                                    <Bar dataKey={WineColor.BLANC} stackId="a" fill={COLORS_MAP[WineColor.BLANC]}>
                                      <LabelList dataKey={WineColor.BLANC} position="center" fill="black" fontSize={fs.label} formatter={(val: number) => val > 0 ? val : ''} />
                                    </Bar>
                                    <Bar dataKey={WineColor.ROSE} stackId="a" fill={COLORS_MAP[WineColor.ROSE]}>
                                      <LabelList dataKey={WineColor.ROSE} position="center" fill="white" fontSize={fs.label} formatter={(val: number) => val > 0 ? val : ''} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </>
                )}
            </div>
        )}

        {renderSectionHeader(`${t('section_history_stats')} (Global)`, showHistoryStats, () => setShowHistoryStats(!showHistoryStats))}
        
        {showHistoryStats && (
             <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                {history.length === 0 ? (
                    <div className={`p-8 text-center text-stone-400 dark:text-stone-600 italic mb-6 ${fs.title}`}>{t('empty_history')}</div>
                ) : (
                    <>
                        <ChartContainer title={t('stats_hist_region_color')} fontSizeClasses={fs}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={histRegionColorData}
                                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? '#44403c' : '#e5e5e5'}/>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={80} tick={{fontSize: fs.tick, fill: isDark ? '#a8a29e' : '#666'}} interval={0}/>
                                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={tooltipStyle} itemStyle={{color: isDark ? '#fff' : '#333'}}/>
                                    <Legend wrapperStyle={{ fontSize: fs.tick }} formatter={legendText}/>
                                    <Bar dataKey={WineColor.ROUGE} stackId="a" fill={COLORS_MAP[WineColor.ROUGE]} radius={[0, 3, 3, 0]}>
                                      <LabelList dataKey={WineColor.ROUGE} position="center" fill="white" fontSize={fs.label} formatter={(val: number) => val > 0 ? val : ''} />
                                    </Bar>
                                    <Bar dataKey={WineColor.BLANC} stackId="a" fill={COLORS_MAP[WineColor.BLANC]}>
                                      <LabelList dataKey={WineColor.BLANC} position="center" fill="black" fontSize={fs.label} formatter={(val: number) => val > 0 ? val : ''} />
                                    </Bar>
                                    <Bar dataKey={WineColor.ROSE} stackId="a" fill={COLORS_MAP[WineColor.ROSE]}>
                                      <LabelList dataKey={WineColor.ROSE} position="center" fill="white" fontSize={fs.label} formatter={(val: number) => val > 0 ? val : ''} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>

                         <ChartContainer title={t('stats_hist_avg_rating_red')} fontSizeClasses={fs}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={histAvgRatingRed}
                                    margin={{ top: 20, right: 5, left: -20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#44403c' : '#e5e5e5'}/>
                                    <XAxis dataKey="name" tick={{fontSize: fs.tick, fill: isDark ? '#a8a29e' : '#666'}} interval={0} />
                                    <YAxis domain={[0, 5]} tick={{fontSize: fs.tick, fill: isDark ? '#a8a29e' : '#666'}} />
                                    <Tooltip cursor={{fill: isDark ? '#292524' : '#f5f5f4'}} contentStyle={tooltipStyle} itemStyle={{color: isDark ? '#fff' : '#333'}}/>
                                    <Bar dataKey="rating" name={t('avg_rating_short')} fill={COLORS_MAP[WineColor.ROUGE]} radius={[4, 4, 0, 0]} barSize={40}>
                                      <LabelList dataKey="rating" position="top" fill={isDark ? "#a8a29e" : "#44403c"} fontSize={fs.label} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>

                        <ChartContainer title={t('stats_hist_avg_rating_white')} fontSizeClasses={fs}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={histAvgRatingWhite}
                                    margin={{ top: 20, right: 5, left: -20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#44403c' : '#e5e5e5'}/>
                                    <XAxis dataKey="name" tick={{fontSize: fs.tick, fill: isDark ? '#a8a29e' : '#666'}} interval={0} />
                                    <YAxis domain={[0, 5]} tick={{fontSize: fs.tick, fill: isDark ? '#a8a29e' : '#666'}} />
                                    <Tooltip cursor={{fill: isDark ? '#292524' : '#f5f5f4'}} contentStyle={tooltipStyle} itemStyle={{color: isDark ? '#fff' : '#333'}}/>
                                    <Bar dataKey="rating" name={t('avg_rating_short')} fill={COLORS_MAP[WineColor.BLANC]} radius={[4, 4, 0, 0]} barSize={40}>
                                      <LabelList dataKey="rating" position="top" fill={isDark ? "#a8a29e" : "#44403c"} fontSize={fs.label} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>

                        <ChartContainer title={t('stats_hist_cons_color')} fontSizeClasses={fs}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={histColorData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={renderCustomLabel}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {histColorData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS_MAP[Object.keys(COLORS_MAP).find(k => t('color_'+k) === entry.name) || ''] || '#ccc'} stroke={isDark ? '#1c1917' : '#fff'}/>
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} itemStyle={{color: isDark ? '#fff' : '#333'}}/>
                                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: fs.tick }}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>

                        <ChartContainer title={t('stats_hist_cons_region')} fontSizeClasses={fs}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={histRegionData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        paddingAngle={5}
                                        labelLine={false}
                                        label={renderCustomLabel}
                                    >
                                        {histRegionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke={isDark ? '#1c1917' : '#fff'}/>
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} itemStyle={{color: isDark ? '#fff' : '#333'}}/>
                                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: fs.tick }}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>

                         <ChartContainer title={t('stats_hist_cons_year')} fontSizeClasses={fs}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={histYearData}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        labelLine={false}
                                        label={renderCustomLabel}
                                    >
                                        {histYearData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[(index + 2) % PIE_COLORS.length]} stroke={isDark ? '#1c1917' : '#fff'}/>
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} itemStyle={{color: isDark ? '#fff' : '#333'}}/>
                                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: fs.tick }}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>

                         <ChartContainer title={t('stats_hist_cons_country')} fontSizeClasses={fs}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={histCountryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        paddingAngle={5}
                                        labelLine={false}
                                        label={renderCustomLabel}
                                    >
                                        {histCountryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[(index + 5) % PIE_COLORS.length]} stroke={isDark ? '#1c1917' : '#fff'}/>
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} itemStyle={{color: isDark ? '#fff' : '#333'}}/>
                                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: fs.tick }}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </>
                )}
             </div>
        )}
    </div>
  );
};