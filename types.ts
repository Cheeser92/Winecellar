
export enum WineColor {
  ROUGE = 'Rouge',
  BLANC = 'Blanc',
  ROSE = 'Rosé'
}

export enum AgingPotential {
  LONGUE = 'Longue',
  MOYENNE = 'Moyenne',
  COURTE = 'Courte'
}

export enum ConsumptionStatus {
  GREEN = 'Vert',
  ORANGE = 'Orange',
  RED = 'Rouge'
}

export type StorageLocation = string;
export const LOCATION_HORS_CAVE = 'Hors cave';

export interface Wine {
  id: string;
  name: string;
  appellation: string;
  region: string;
  country: string;
  color: WineColor;
  year: number;
  origin: string;
  purchaseDate: string;
  purchasePlace: string;
  quantity: number;
  recommendedYear: number;
  price: number;
  strength: number;
  tag: string;
  note: string;
  agingPotential: AgingPotential;
  image: string | null;
  location: StorageLocation;
}

export interface HistoryEntry extends Wine {
  consumedDate: string;
  consumptionRating: number;
  originalCellarName?: string;
}

export interface SearchFilters {
  name?: string;
  appellation?: string;
  region?: string;
  country?: string;
  color?: string;
  year?: number;
  origin?: string;
  recommendedYear?: number;
  strength?: number;
  agingPotential?: string;
  tag?: string;
  searchScope?: 'current' | 'all';
}

export type Language = 'fr' | 'en';
export type Theme = 'light' | 'dark';
export type AppFontSize = 'small' | 'medium' | 'large';
export type ColorTheme = 'default' | 'blue' | 'red' | 'yellow' | 'mauve' | 'green';
export type ImageCompression = 'low' | 'moderate' | 'strong';

export interface AppSettings {
  language: Language;
  theme: Theme;
  shelfCount: number;
  fontSize: AppFontSize;
  colorTheme?: ColorTheme;
  imageCompression?: ImageCompression;
}

export interface LocationData {
  countries: string[];
  regions: Record<string, string[]>;
}

export interface Cellar {
  id: string;
  name: string;
  image: string | null;
  wines: Wine[];
  settings: AppSettings;
}

export interface BackupData {
  cellars: Cellar[];
  activeCellarId: string;
  globalHistory?: HistoryEntry[];
  locations?: LocationData;
  timestamp: string;
}