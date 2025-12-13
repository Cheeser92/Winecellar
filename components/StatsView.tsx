import React, { useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';
import { Wine, WineColor, Language, Theme, HistoryEntry } from '../types';
import { getTranslation } from '../translations';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface StatsViewProps {
  wines: Wine[];
  history: HistoryEntry[];
  language: Language;
  theme: Theme;
}

const COLORS_MAP: Record<string, string> = {
  [WineColor.ROUGE]: '#881337', // rose-900
  [WineColor.BLANC]: '#fbbf24', // amber-400
  [WineColor.ROSE]: '#f472b6',  // pink-400
};

const PIE_COLORS = ['#881337', '#be123c', '#fb7185', '#f472b6', '#fbbf24', '#fcd34d', '#4ade80', '#22c55e', '#15803d', '#1e40af', '#3b82f6'];

const ChartContainer = ({ title, children }: { title: string, children?: React.ReactNode }) => (
  <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 mb-4 transition-colors">
    <h3 className="text-sm font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wide mb-4 border-b border-stone-100 dark:border-stone-800 pb-2">{title}</h3>
    <div className="h-64 w-full text-xs">
      {children}
    </div>
  </div>
);

export const StatsView: React.FC<StatsViewProps> = ({ wines, history, language, theme }) => {
  const t = (key: any) => getTranslation(language, key);
  const isDark = theme === 'dark';

  const [showCellarStats, setShowCellarStats] = useState(true);
  const [showHistoryStats, setShowHistoryStats] = useState(true);

  // Common render helpers
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
  
    return percent > 0.05 ? (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fontWeight="bold" style={{ textShadow: '0px 0px 3px rgba(0,0,0,0.5)' }}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  const tooltipStyle = {
    backgroundColor: isDark ? '#1c1917' : '#fff',
    borderColor: isDark ? '#292524' : '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    color: isDark ? '#f5f5f4' : '#333'
  };

  // --- CELLAR DATA PROCESSING ---

  // 1. Color (Pie)
  const cellarColorData = Object.entries(wines.reduce((acc, wine) => {
    const qty = Number(wine.quantity);
    acc[wine.color] = (acc[wine.color] || 0) + qty;
    return acc;
  }, {} as Record<string, number>)).map(([name, value]) => ({ name, value }));

  // Helper for Stacked Bar Charts
  const processStackedData = (items: Wine[], key: keyof Wine) => {
    const rawData = items.reduce((acc, wine) => {
      const groupKey = String(wine[key]) || 'Inconnu';
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

  const cellarYearDataRaw = wines.reduce((acc, wine) => {
    if (!wine.purchaseDate) return acc;
    const year = new Date(wine.purchaseDate).getFullYear().toString();
    const qty = Number(wine.quantity);
    acc[year] = (acc[year] || 0) + qty;
    return acc;
  }, {} as Record<string, number>);

  const cellarYearData = Object.entries(cellarYearDataRaw)
    .map(([year, quantity]) => ({ year, quantity }))
    .sort((a, b) => Number(a.year) - Number(b.year));

  // --- HISTORY DATA PROCESSING ---

  // 1. Region & Color (Stacked Bar)
  const histRegionColorData = processStackedData(history, 'region');

  // 2. & 3. Avg Rating Helpers - Now Weighted by Quantity
  const getAvgRatingByRegion = (color: string) => {
      const grouped = history
        .filter(h => h.color === color)
        .reduce((acc: Record<string, { sum: number; count: number }>, h) => {
            const region = h.region || 'Inconnu';
            if (!acc[region]) acc[region] = { sum: 0, count: 0 };
            const qty = Number(h.quantity);
            acc[region].sum += h.consumptionRating * qty;
            acc[region].count += qty;
            return acc;
        }, {} as Record<string, { sum: number; count: number }>);
      
      return Object.entries(grouped).map(([name, val]) => ({
          name,
          rating: val.count > 0 ? Number((val.sum / val.count).toFixed(1)) : 0
      }));
  };

  const histAvgRatingRed = getAvgRatingByRegion(WineColor.ROUGE);
  const histAvgRatingWhite = getAvgRatingByRegion(WineColor.BLANC);

  // 4, 5, 6, 7 Pie Charts Helpers
  const getPieData = (key: keyof HistoryEntry) => {
      const grouped = history.reduce((acc, h) => {
          const val = String(h[key]) || 'Inconnu';
          const qty = Number(h.quantity);
          acc[val] = (acc[val] || 0) + qty;
          return acc;
      }, {} as Record<string, number>);
      return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  };

  const histColorData = getPieData('color');
  const histRegionData = getPieData('region');
  const histYearData = getPieData('year'); // Vintage
  const histCountryData = getPieData('country');

  // RENDERERS

  const renderSectionHeader = (title: string, isOpen: boolean, toggle: () => void) => (
    <button 
        onClick={toggle}
        className="w-full flex items-center justify-between p-4 bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 mb-4 transition-colors"
    >
        <span className="text-lg font-bold text-rose-950 dark:text-rose-100">{title}</span>
        <div className="text-stone-400 dark:text-stone-500">
            {isOpen ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
        </div>
    </button>
  );

  return (
    <div className="pb-24 p-4">
        <h1 className="text-3xl font-serif font-bold text-rose-950 dark:text-rose-100 mb-6 px-2 pt-2">{t('stats')}</h1>

        {/* CELLAR STATS SECTION */}
        {renderSectionHeader(t('section_cellar_stats'), showCellarStats, () => setShowCellarStats(!showCellarStats))}
        
        {showCellarStats && (
            <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                {wines.length === 0 ? (
                    <div className="p-8 text-center text-stone-400 dark:text-stone-600 italic mb-6">{t('empty_cellar')}</div>
                ) : (
                    <>
                        {/* 1. Pie Chart - Color */}
                        <ChartContainer title={t('stats_color')}>
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
                                            <Cell key={`cell-${index}`} fill={COLORS_MAP[entry.name] || '#ccc'} stroke={isDark ? '#1c1917' : '#fff'}/>
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} itemStyle={{color: isDark ? '#fff' : '#333'}}/>
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>

                        {/* 2. Bar Chart - Region & Color */}
                        <ChartContainer title={t('stats_region')}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={cellarRegionData}
                                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? '#44403c' : '#e5e5e5'}/>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 10, fill: isDark ? '#a8a29e' : '#666'}} interval={0}/>
                                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={tooltipStyle} itemStyle={{color: isDark ? '#fff' : '#333'}}/>
                                    <Legend />
                                    <Bar dataKey={WineColor.ROUGE} stackId="a" fill={COLORS_MAP[WineColor.ROUGE]} radius={[0, 3, 3, 0]}>
                                      <LabelList dataKey={WineColor.ROUGE} position="center" fill="white" fontSize={10} formatter={(val: number) => val > 0 ? val : ''} />
                                    </Bar>
                                    <Bar dataKey={WineColor.BLANC} stackId="a" fill={COLORS_MAP[WineColor.BLANC]}>
                                      <LabelList dataKey={WineColor.BLANC} position="center" fill="black" fontSize={10} formatter={(val: number) => val > 0 ? val : ''} />
                                    </Bar>
                                    <Bar dataKey={WineColor.ROSE} stackId="a" fill={COLORS_MAP[WineColor.ROSE]}>
                                      <LabelList dataKey={WineColor.ROSE} position="center" fill="white" fontSize={10} formatter={(val: number) => val > 0 ? val : ''} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>

                        {/* 3. Bar Chart - Country & Color */}
                        <ChartContainer title={t('stats_country')}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={cellarCountryData}
                                    margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#44403c' : '#e5e5e5'}/>
                                    <XAxis dataKey="name" tick={{fontSize: 10, fill: isDark ? '#a8a29e' : '#666'}} interval={0}/>
                                    <YAxis tick={{fontSize: 10, fill: isDark ? '#a8a29e' : '#666'}} allowDecimals={false}/>
                                    <Tooltip cursor={{fill: isDark ? '#292524' : '#f5f5f4'}} contentStyle={tooltipStyle} itemStyle={{color: isDark ? '#fff' : '#333'}}/>
                                    <Legend />
                                    <Bar dataKey={WineColor.ROUGE} stackId="a" fill={COLORS_MAP[WineColor.ROUGE]} radius={[3, 3, 0, 0]}>
                                      <LabelList dataKey={WineColor.ROUGE} position="center" fill="white" fontSize={10} formatter={(val: number) => val > 0 ? val : ''} />
                                    </Bar>
                                    <Bar dataKey={WineColor.BLANC} stackId="a" fill={COLORS_MAP[WineColor.BLANC]}>
                                      <LabelList dataKey={WineColor.BLANC} position="center" fill="black" fontSize={10} formatter={(val: number) => val > 0 ? val : ''} />
                                    </Bar>
                                    <Bar dataKey={WineColor.ROSE} stackId="a" fill={COLORS_MAP[WineColor.ROSE]}>
                                      <LabelList dataKey={WineColor.ROSE} position="center" fill="white" fontSize={10} formatter={(val: number) => val > 0 ? val : ''} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>

                        {/* 4. Bar Chart - Purchase Date */}
                        <ChartContainer title={t('stats_year')}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={cellarYearData}
                                    margin={{ top: 20, right: 5, left: -20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#44403c' : '#e5e5e5'}/>
                                    <XAxis dataKey="year" tick={{fontSize: 10, fill: isDark ? '#a8a29e' : '#666'}}/>
                                    <YAxis tick={{fontSize: 10, fill: isDark ? '#a8a29e' : '#666'}} allowDecimals={false}/>
                                    <Tooltip cursor={{fill: isDark ? '#292524' : '#f5f5f4'}} contentStyle={tooltipStyle} itemStyle={{color: isDark ? '#fff' : '#333'}}/>
                                    <Bar dataKey="quantity" name="Quantité" fill={isDark ? '#78716c' : '#44403c'} radius={[4, 4, 0, 0]} barSize={40}>
                                      <LabelList dataKey="quantity" position="top" fill={isDark ? "#a8a29e" : "#44403c"} fontSize={10} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </>
                )}
            </div>
        )}

        {/* HISTORY STATS SECTION */}
        {renderSectionHeader(t('section_history_stats'), showHistoryStats, () => setShowHistoryStats(!showHistoryStats))}
        
        {showHistoryStats && (
             <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                {history.length === 0 ? (
                    <div className="p-8 text-center text-stone-400 dark:text-stone-600 italic mb-6">{t('empty_history')}</div>
                ) : (
                    <>
                         {/* 1. Region & Color (Count) */}
                        <ChartContainer title={t('stats_hist_region_color')}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={histRegionColorData}
                                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? '#44403c' : '#e5e5e5'}/>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 10, fill: isDark ? '#a8a29e' : '#666'}} interval={0}/>
                                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={tooltipStyle} itemStyle={{color: isDark ? '#fff' : '#333'}}/>
                                    <Legend />
                                    <Bar dataKey={WineColor.ROUGE} stackId="a" fill={COLORS_MAP[WineColor.ROUGE]} radius={[0, 3, 3, 0]}>
                                      <LabelList dataKey={WineColor.ROUGE} position="center" fill="white" fontSize={10} formatter={(val: number) => val > 0 ? val : ''} />
                                    </Bar>
                                    <Bar dataKey={WineColor.BLANC} stackId="a" fill={COLORS_MAP[WineColor.BLANC]}>
                                      <LabelList dataKey={WineColor.BLANC} position="center" fill="black" fontSize={10} formatter={(val: number) => val > 0 ? val : ''} />
                                    </Bar>
                                    <Bar dataKey={WineColor.ROSE} stackId="a" fill={COLORS_MAP[WineColor.ROSE]}>
                                      <LabelList dataKey={WineColor.ROSE} position="center" fill="white" fontSize={10} formatter={(val: number) => val > 0 ? val : ''} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>

                        {/* 2. Avg Rating (Red) */}
                         <ChartContainer title={t('stats_hist_avg_rating_red')}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={histAvgRatingRed}
                                    margin={{ top: 20, right: 5, left: -20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#44403c' : '#e5e5e5'}/>
                                    <XAxis dataKey="name" tick={{fontSize: 10, fill: isDark ? '#a8a29e' : '#666'}} interval={0} />
                                    <YAxis domain={[0, 5]} tick={{fontSize: 10, fill: isDark ? '#a8a29e' : '#666'}} />
                                    <Tooltip cursor={{fill: isDark ? '#292524' : '#f5f5f4'}} contentStyle={tooltipStyle} itemStyle={{color: isDark ? '#fff' : '#333'}}/>
                                    <Bar dataKey="rating" name="Note Moy." fill={COLORS_MAP[WineColor.ROUGE]} radius={[4, 4, 0, 0]} barSize={40}>
                                      <LabelList dataKey="rating" position="top" fill={isDark ? "#a8a29e" : "#44403c"} fontSize={10} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>

                        {/* 3. Avg Rating (White) */}
                        <ChartContainer title={t('stats_hist_avg_rating_white')}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={histAvgRatingWhite}
                                    margin={{ top: 20, right: 5, left: -20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#44403c' : '#e5e5e5'}/>
                                    <XAxis dataKey="name" tick={{fontSize: 10, fill: isDark ? '#a8a29e' : '#666'}} interval={0} />
                                    <YAxis domain={[0, 5]} tick={{fontSize: 10, fill: isDark ? '#a8a29e' : '#666'}} />
                                    <Tooltip cursor={{fill: isDark ? '#292524' : '#f5f5f4'}} contentStyle={tooltipStyle} itemStyle={{color: isDark ? '#fff' : '#333'}}/>
                                    <Bar dataKey="rating" name="Note Moy." fill={COLORS_MAP[WineColor.BLANC]} radius={[4, 4, 0, 0]} barSize={40}>
                                      <LabelList dataKey="rating" position="top" fill={isDark ? "#a8a29e" : "#44403c"} fontSize={10} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>

                        {/* 4. Consumption by Color (Pie) */}
                        <ChartContainer title={t('stats_hist_cons_color')}>
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
                                            <Cell key={`cell-${index}`} fill={COLORS_MAP[entry.name] || '#ccc'} stroke={isDark ? '#1c1917' : '#fff'}/>
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} itemStyle={{color: isDark ? '#fff' : '#333'}}/>
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>

                        {/* 5. Consumption by Region (Pie) */}
                         <ChartContainer title={t('stats_hist_cons_region')}>
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
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>

                         {/* 6. Consumption by Year (Pie) */}
                         <ChartContainer title={t('stats_hist_cons_year')}>
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
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>

                         {/* 7. Consumption by Country (Pie) */}
                         <ChartContainer title={t('stats_hist_cons_country')}>
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
                                    <Legend verticalAlign="bottom" height={36}/>
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