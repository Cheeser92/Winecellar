
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

// StorageLocation est maintenant un string pour supporter "Etagère N" dynamiquement
export type StorageLocation = string;
export const LOCATION_HORS_CAVE = 'Hors cave';

export interface Wine {
  id: string;
  name: string;
  appellation: string;
  region: string; // Changé de Region enum à string pour flexibilité
  country: string;
  color: WineColor;
  year: number; // Vintage
  origin: string;
  purchaseDate: string; // ISO Date string
  purchasePlace: string;
  quantity: number;
  recommendedYear: number;
  price: number;
  strength: number; // 100, 75, 50, 25, 0
  tag: string;
  note: string; // Text note
  agingPotential: AgingPotential;
  image: string | null; // Base64
  location: StorageLocation;
}

export interface HistoryEntry extends Wine {
  consumedDate: string;
  consumptionRating: number; // 1-5
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
}

export type Language = 'fr' | 'en';
export type Theme = 'light' | 'dark';
export type AppFontSize = 'small' | 'medium' | 'large';

export interface AppSettings {
  language: Language;
  theme: Theme;
  shelfCount: number;
  fontSize: AppFontSize;
}

export interface BackupData {
  wines: Wine[];
  history: HistoryEntry[];
  settings: AppSettings;
  timestamp: string;
}
