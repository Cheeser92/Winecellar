
import { WineColor, AgingPotential } from './types';

export const COLORS = Object.values(WineColor);
export const AGING_POTENTIALS = Object.values(AgingPotential);
export const STRENGTHS = [100, 75, 50, 25];
export const RATINGS = [1, 2, 3, 4, 5];

export const COUNTRIES_FR = [
  "France", "Italie", "Espagne", "États-Unis", "Argentine", "Chili", "Australie", "Afrique du Sud", "Allemagne", "Portugal", "Grèce", "Autriche", "Nouvelle-Zélande", "Suisse", "Hongrie", "Chine", "Canada"
];

export const COUNTRIES_EN = [
  "France", "Italy", "Spain", "United States", "Argentina", "Chile", "Australia", "South Africa", "Germany", "Portugal", "Greece", "Austria", "New Zealand", "Switzerland", "Hungary", "China", "Canada"
];

export const REGIONS_BY_COUNTRY_FR: Record<string, string[]> = {
  "France": [
    "Alsace", "Beaujolais", "Bordeaux", "Bourgogne", "Champagne", "Corse", "Jura", "Languedoc", "Roussillon", "Loire", "Provence", "Rhône", "Savoie", "Sud-Ouest"
  ],
  "Italie": [
    "Abruzzes", "Basilicata", "Calabre", "Campanie", "Émilie-Romagne", "Frioul-Vénétie Julienne", "Latium", "Ligurie", "Lombardie", "Marches", "Molise", "Piémont", "Pouilles", "Sardaigne", "Sicile", "Toscane", "Trentin-Haut-Adige", "Ombrie", "Vallée d'Aoste", "Vénétie"
  ],
  "Espagne": [
    "Andalousie", "Aragon", "Asturies", "Baléares", "Canaries", "Cantabrie", "Castille-et-León", "Castille-La Manche", "Catalogne", "Estrémadure", "Galice", "Madrid", "Murcie", "Navarre", "Pays Basque", "La Rioja", "Valence"
  ],
  "États-Unis": [
    "Californie", "Oregon", "Washington", "New York", "Virginie", "Texas", "Pennsylvanie"
  ],
  "Argentine": ["Mendoza", "San Juan", "La Rioja", "Salta", "Catamarca", "Neuquén", "Río Negro"],
  "Chili": ["Atacama", "Coquimbo", "Aconcagua", "Vallée Centrale", "Sud"],
  "Australie": ["Australie-Méridionale", "Nouvelle-Galles du Sud", "Victoria", "Australie-Occidentale", "Tasmanie", "Queensland"],
  "Afrique du Sud": ["Cap-Occidental", "Cap-Nord", "Cap-Oriental", "KwaZulu-Natal", "Limpopo"],
  "Allemagne": ["Ahr", "Bade", "Franconie", "Hessische Bergstraße", "Rhin-Moyen", "Moselle", "Nahe", "Palatinat", "Rheingau", "Hesse-Rhénane", "Saale-Unstrut", "Saxe", "Wurtemberg"],
  "Portugal": ["Alentejo", "Algarve", "Açores", "Beira Interior", "Dão", "Douro", "Lisbonne", "Madère", "Péninsule de Setúbal", "Tage", "Trás-os-Montes", "Vinho Verde"],
  "Suisse": ["Valais", "Vaud", "Genève", "Tessin", "Neuchâtel", "Zurich"]
};

export const REGIONS_BY_COUNTRY_EN: Record<string, string[]> = {
  "France": [
    "Alsace", "Beaujolais", "Bordeaux", "Burgundy", "Champagne", "Corsica", "Jura", "Languedoc", "Roussillon", "Loire", "Provence", "Rhône", "Savoy", "South West"
  ],
  "Italy": [
    "Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna", "Friuli-Venezia Giulia", "Lazio", "Liguria", "Lombardy", "Marche", "Molise", "Piedmont", "Puglia", "Sardinia", "Sicily", "Tuscany", "Trentino-Alto Adige", "Umbria", "Aosta Valley", "Veneto"
  ],
  "Spain": [
    "Andalusia", "Aragon", "Asturias", "Balearic Islands", "Canary Islands", "Cantabria", "Castile and León", "Castile-La Mancha", "Catalonia", "Extremadura", "Galicia", "Madrid", "Murcia", "Navarre", "Basque Country", "La Rioja", "Valencia"
  ],
  "United States": [
    "California", "Oregon", "Washington", "New York", "Virginia", "Texas", "Pennsylvania"
  ],
  "Argentina": ["Mendoza", "San Juan", "La Rioja", "Salta", "Catamarca", "Neuquén", "Río Negro"],
  "Chile": ["Atacama", "Coquimbo", "Aconcagua", "Central Valley", "South"],
  "Australia": ["South Australia", "New South Wales", "Victoria", "Western Australia", "Tasmania", "Queensland"],
  "South Africa": ["Western Cape", "Northern Cape", "Eastern Cape", "KwaZulu-Natal", "Limpopo"],
  "Germany": ["Ahr", "Baden", "Franconia", "Hessische Bergstraße", "Middle Rhine", "Mosel", "Nahe", "Palatinate", "Rheingau", "Rheinhessen", "Saale-Unstrut", "Saxony", "Württemberg"],
  "Portugal": ["Alentejo", "Algarve", "Azores", "Beira Interior", "Dão", "Douro", "Lisbon", "Madeira", "Setúbal Peninsula", "Tejo", "Trás-os-Montes", "Vinho Verde"],
  "Switzerland": ["Valais", "Vaud", "Geneva", "Ticino", "Neuchâtel", "Zurich"]
};
