import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  ChevronDown,
  Check,
  Clock3,
  Copy,
  DatabaseBackup,
  Download,
  Gauge,
  Image,
  KeyRound,
  Layers,
  Languages,
  Link as LinkIcon,
  Loader2,
  Plus,
  Printer,
  Save,
  ScrollText,
  Search,
  ServerCog,
  Share2,
  Settings,
  ShieldCheck,
  Tags,
  Trash2,
  UploadCloud,
  Utensils,
  X,
  Video
} from 'lucide-react';
import { api, configureAuth } from './api.js';

const emptyIngredient = { name: '', quantity: '', unit: '', notes: '' };
const emptyStep = { text: '' };
const isAdminUser = true;
const MAX_IMPORT_PHOTOS = 5;
const MAX_IMPORT_PHOTO_BYTES = 4 * 1024 * 1024;
const IMPORT_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const AUTH_SESSION_KEY = 'tl_recipe_core_management_auth';
const FALLBACK_LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'af', label: 'Afrikaans' }
];

const EN_MESSAGES = {
  recipes: 'Recipes',
  addRecipe: 'Add Recipe',
  importRecipe: 'Import from URL',
  tagsSearch: 'Tags / Search',
  settings: 'Settings',
  saasManagement: 'SaaS Management',
  recipeLibrary: 'Recipe library',
  add: 'Add',
  searchPlaceholder: 'Search recipes, ingredients, descriptions',
  categories: 'Categories',
  tags: 'Tags',
  allCategories: 'All categories',
  allTags: 'All tags',
  noRecipesFound: 'No recipes found',
  edit: 'Edit',
  delete: 'Delete',
  manualRecipe: 'Manual recipe',
  sourceRecipe: 'Source recipe',
  recipeVideo: 'Watch recipe video',
  savedSource: 'Saved source',
  savedSourceHint: 'Archived copy of the source page, kept in case the original goes offline.',
  ingredients: 'Ingredients',
  method: 'Method',
  importStats: 'Import stats',
  aiImportUsage: 'AI import usage',
  model: 'Model',
  inputTokens: 'Input tokens',
  outputTokens: 'Output tokens',
  responseTime: 'Response time',
  estimatedCost: 'Estimated cost',
  stepImages: 'Step images',
  original: 'Original',
  userSettings: 'User settings',
  general: 'General',
  llm: 'LLM',
  backup: 'Backup',
  defaultLanguage: 'Default language',
  defaultUnitSystem: 'Default unit system',
  categoryFilters: 'Recipe category filters',
  addCategory: 'Add category',
  saveSettings: 'Save settings',
  saved: 'Saved',
  publicBrowsing: 'Public browsing',
  signInWhenNeeded: 'Sign in when needed',
  managementUnlocked: 'Management unlocked',
  basicAuthActive: 'Basic Auth active',
  recipeLanguage: 'Recipe language',
  originalRecipe: 'Original recipe',
  recipeTranslations: 'Recipe translations',
  generateMissingTranslations: 'Generate missing translations',
  translationMissing: 'This recipe is not translated to the selected language yet.',
  importPhotos: 'Import photos',
  importPhotosHint: 'This recipe was imported from these photos.',
  share: 'Share',
  shareRecipe: 'Share this recipe',
  shareHint: 'Anyone with this link can view just this recipe — not the rest of your library.',
  copyLink: 'Copy link',
  linkCopied: 'Link copied',
  shareViaApps: 'Share…',
  saveAsPdf: 'Save as PDF',
  stopSharing: 'Stop sharing',
  openSharedView: 'Open shared view',
  sharedRecipe: 'Shared recipe',
  sharedRecipeMissing: 'This shared recipe is no longer available.',
  recipeBy: 'Recipe',
  shareExpiry: 'Link expiry',
  expiryNone: 'No expiry',
  expiry1h: '1 hour',
  expiry24h: '24 hours',
  expiry7d: '7 days',
  expiry30d: '30 days',
  createLink: 'Create link',
  neverExpires: 'This link never expires.',
  expiresOn: 'Expires',
  nutrition: 'Nutrition',
  nutritionTitle: 'Nutritional values',
  calculateNutrition: 'Calculate nutrition',
  recalculateNutrition: 'Recalculate',
  perServing: 'Per serving',
  wholeRecipe: 'Whole recipe',
  servingsLabel: 'Servings',
  calories: 'Calories',
  protein: 'Protein',
  carbs: 'Carbs',
  fat: 'Fat',
  fiber: 'Fiber',
  sugar: 'Sugar',
  sodium: 'Sodium',
  nutritionDisclaimer: 'Estimated values — for general guidance only, not medical or dietary advice.',
  macroSplit: 'Protein / fat / carbs',
  macroSplitEmpty: 'Not enough data for a macro split.'
};

const I18nContext = createContext({
  language: 'en',
  preferences: { categoryFilters: [] },
  setPreferences: () => {},
  t: (key) => EN_MESSAGES[key] || key
});

const MESSAGES = {
  en: EN_MESSAGES,
  de: {
    recipes: 'Rezepte',
    addRecipe: 'Rezept hinzufügen',
    importRecipe: 'Aus URL importieren',
    tagsSearch: 'Tags / Suche',
    settings: 'Einstellungen',
    saasManagement: 'SaaS-Verwaltung',
    recipeLibrary: 'Rezeptbibliothek',
    add: 'Hinzufügen',
    searchPlaceholder: 'Rezepte, Zutaten, Beschreibungen suchen',
    categories: 'Kategorien',
    tags: 'Tags',
    allCategories: 'Alle Kategorien',
    allTags: 'Alle Tags',
    noRecipesFound: 'Keine Rezepte gefunden',
    edit: 'Bearbeiten',
    delete: 'Löschen',
    manualRecipe: 'Manuelles Rezept',
    sourceRecipe: 'Originalrezept',
    recipeVideo: 'Rezeptvideo ansehen',
    savedSource: 'Gespeicherte Quelle',
    savedSourceHint: 'Archivierte Kopie der Quellseite, falls das Original offline geht.',
    ingredients: 'Zutaten',
    method: 'Zubereitung',
    importStats: 'Importstatistik',
    aiImportUsage: 'KI-Importnutzung',
    model: 'Modell',
    inputTokens: 'Eingabe-Token',
    outputTokens: 'Ausgabe-Token',
    responseTime: 'Antwortzeit',
    estimatedCost: 'Geschätzte Kosten',
    stepImages: 'Schrittbilder',
    original: 'Original',
    userSettings: 'Benutzereinstellungen',
    general: 'Allgemein',
    llm: 'LLM',
    backup: 'Backup',
    defaultLanguage: 'Standardsprache',
    defaultUnitSystem: 'Standard-Einheitensystem',
    categoryFilters: 'Rezept-Kategoriefilter',
    addCategory: 'Kategorie hinzufügen',
    saveSettings: 'Einstellungen speichern',
    saved: 'Gespeichert',
    publicBrowsing: 'Öffentliches Browsen',
    signInWhenNeeded: 'Bei Bedarf anmelden',
    managementUnlocked: 'Verwaltung entsperrt',
    basicAuthActive: 'Basic Auth aktiv',
    recipeLanguage: 'Rezeptsprache',
    originalRecipe: 'Originalrezept',
    recipeTranslations: 'Rezeptübersetzungen',
    generateMissingTranslations: 'Fehlende Übersetzungen erstellen',
    translationMissing: 'Dieses Rezept ist noch nicht in die ausgewählte Sprache übersetzt.',
    importPhotos: 'Importfotos',
    importPhotosHint: 'Dieses Rezept wurde aus diesen Fotos importiert.',
    share: 'Teilen',
    shareRecipe: 'Dieses Rezept teilen',
    shareHint: 'Wer den Link hat, sieht nur dieses Rezept — nicht den Rest deiner Sammlung.',
    copyLink: 'Link kopieren',
    linkCopied: 'Link kopiert',
    shareViaApps: 'Teilen…',
    saveAsPdf: 'Als PDF speichern',
    stopSharing: 'Teilen beenden',
    openSharedView: 'Geteilte Ansicht öffnen',
    sharedRecipe: 'Geteiltes Rezept',
    sharedRecipeMissing: 'Dieses geteilte Rezept ist nicht mehr verfügbar.',
    recipeBy: 'Rezept',
    shareExpiry: 'Link-Ablauf',
    expiryNone: 'Kein Ablauf',
    expiry1h: '1 Stunde',
    expiry24h: '24 Stunden',
    expiry7d: '7 Tage',
    expiry30d: '30 Tage',
    createLink: 'Link erstellen',
    neverExpires: 'Dieser Link läuft nie ab.',
    expiresOn: 'Läuft ab',
    nutrition: 'Nährwerte',
    nutritionTitle: 'Nährwertangaben',
    calculateNutrition: 'Nährwerte berechnen',
    recalculateNutrition: 'Neu berechnen',
    perServing: 'Pro Portion',
    wholeRecipe: 'Ganzes Rezept',
    servingsLabel: 'Portionen',
    calories: 'Kalorien',
    protein: 'Eiweiß',
    carbs: 'Kohlenhydrate',
    fat: 'Fett',
    fiber: 'Ballaststoffe',
    sugar: 'Zucker',
    sodium: 'Natrium',
    nutritionDisclaimer: 'Geschätzte Werte — nur zur allgemeinen Orientierung, keine medizinische oder Ernährungsberatung.',
    macroSplit: 'Eiweiß / Fett / Kohlenhydrate',
    macroSplitEmpty: 'Nicht genug Daten für eine Makro-Aufteilung.'
  },
  af: {
    recipes: 'Resepte',
    addRecipe: 'Voeg resep by',
    importRecipe: 'Voer vanaf URL in',
    tagsSearch: 'Etikette / Soek',
    settings: 'Instellings',
    saasManagement: 'SaaS-bestuur',
    recipeLibrary: 'Resepbiblioteek',
    add: 'Voeg by',
    searchPlaceholder: 'Soek resepte, bestanddele, beskrywings',
    categories: 'Kategorieë',
    tags: 'Etikette',
    allCategories: 'Alle kategorieë',
    allTags: 'Alle etikette',
    noRecipesFound: 'Geen resepte gevind nie',
    edit: 'Wysig',
    delete: 'Verwyder',
    manualRecipe: 'Handresep',
    sourceRecipe: 'Bronresep',
    recipeVideo: 'Kyk resepvideo',
    savedSource: 'Gestoorde bron',
    savedSourceHint: 'Geargiveerde kopie van die bronbladsy, ingeval die oorspronklike aflyn gaan.',
    ingredients: 'Bestanddele',
    method: 'Metode',
    importStats: 'Invoerstatistiek',
    aiImportUsage: 'KI-invoergebruik',
    model: 'Model',
    inputTokens: 'Invoer-tokens',
    outputTokens: 'Uitvoer-tokens',
    responseTime: 'Reaksietyd',
    estimatedCost: 'Geskatte koste',
    stepImages: 'Stapbeelde',
    original: 'Oorspronklik',
    userSettings: 'Gebruikerinstellings',
    general: 'Algemeen',
    llm: 'LLM',
    backup: 'Rugsteun',
    defaultLanguage: 'Standaardtaal',
    defaultUnitSystem: 'Standaard eenheidstelsel',
    categoryFilters: 'Resep-kategoriefilters',
    addCategory: 'Voeg kategorie by',
    saveSettings: 'Stoor instellings',
    saved: 'Gestoor',
    publicBrowsing: 'Publieke blaai',
    signInWhenNeeded: 'Meld aan wanneer nodig',
    managementUnlocked: 'Bestuur ontsluit',
    basicAuthActive: 'Basic Auth aktief',
    recipeLanguage: 'Reseptaal',
    originalRecipe: 'Oorspronklike resep',
    recipeTranslations: 'Resepvertalings',
    generateMissingTranslations: 'Skep ontbrekende vertalings',
    translationMissing: 'Hierdie resep is nog nie in die gekose taal vertaal nie.',
    importPhotos: "Invoerfoto's",
    importPhotosHint: "Hierdie resep is vanaf hierdie foto's ingevoer.",
    share: 'Deel',
    shareRecipe: 'Deel hierdie resep',
    shareHint: 'Enigeen met hierdie skakel sien net hierdie resep — nie die res van jou versameling nie.',
    copyLink: 'Kopieer skakel',
    linkCopied: 'Skakel gekopieer',
    shareViaApps: 'Deel…',
    saveAsPdf: 'Stoor as PDF',
    stopSharing: 'Hou op deel',
    openSharedView: 'Open gedeelde aansig',
    sharedRecipe: 'Gedeelde resep',
    sharedRecipeMissing: 'Hierdie gedeelde resep is nie meer beskikbaar nie.',
    recipeBy: 'Resep',
    shareExpiry: 'Skakel verval',
    expiryNone: 'Geen verval',
    expiry1h: '1 uur',
    expiry24h: '24 uur',
    expiry7d: '7 dae',
    expiry30d: '30 dae',
    createLink: 'Skep skakel',
    neverExpires: 'Hierdie skakel verval nooit nie.',
    expiresOn: 'Verval',
    nutrition: 'Voedingswaarde',
    nutritionTitle: 'Voedingswaardes',
    calculateNutrition: 'Bereken voedingswaarde',
    recalculateNutrition: 'Herbereken',
    perServing: 'Per porsie',
    wholeRecipe: 'Hele resep',
    servingsLabel: 'Porsies',
    calories: 'Kalorieë',
    protein: 'Proteïen',
    carbs: 'Koolhidrate',
    fat: 'Vet',
    fiber: 'Vesel',
    sugar: 'Suiker',
    sodium: 'Natrium',
    nutritionDisclaimer: 'Geskatte waardes — slegs vir algemene riglyne, nie mediese of dieetadvies nie.',
    macroSplit: 'Proteïen / vet / koolhidrate',
    macroSplitEmpty: 'Nie genoeg data vir \'n makro-verdeling nie.'
  }
};

const CATEGORY_TRANSLATIONS = {
  Starters: { en: 'Starters', de: 'Vorspeisen', af: 'Voorgeregte' },
  Mains: { en: 'Mains', de: 'Hauptgerichte', af: 'Hoofgeregte' },
  Desserts: { en: 'Desserts', de: 'Desserts', af: 'Nageregte' },
  Drinks: { en: 'Drinks', de: 'Getränke', af: 'Drankies' },
  Cookies: { en: 'Cookies', de: 'Kekse', af: 'Koekies' },
  Cakes: { en: 'Cakes', de: 'Kuchen', af: 'Koeke' },
  Tarts: { en: 'Tarts', de: 'Tartes', af: 'Terte' },
  Vegan: { en: 'Vegan', de: 'Vegan', af: 'Vegan' },
  Vegetarian: { en: 'Vegetarian', de: 'Vegetarisch', af: 'Vegetaries' },
  'Sugar Free': { en: 'Sugar Free', de: 'Zuckerfrei', af: 'Suikervry' },
  'One-Pot': { en: 'One-Pot', de: 'Eintopf', af: 'Eenpot' }
};

function useI18n() {
  return useContext(I18nContext);
}

function translateCategoryName(name, language) {
  return CATEGORY_TRANSLATIONS[name]?.[language] || name;
}

function languageOptions(preferences) {
  return preferences?.supportedLanguages?.length ? preferences.supportedLanguages : FALLBACK_LANGUAGE_OPTIONS;
}

function translatedTags(recipe, language) {
  if (language === 'original') return tagNames(recipe);
  const translated = recipe.translations?.[language]?.tags || [];
  const baseTags = tagNames(recipe);
  return baseTags.map((tag, index) => translateCategoryName(translated[index] || tag, language));
}

function displayRecipe(recipe, language) {
  if (language === 'original') return recipe;
  const translation = recipe?.translations?.[language];
  if (!translation) return recipe;

  return {
    ...recipe,
    title: translation.title || recipe.title,
    shortDescription: translation.shortDescription || recipe.shortDescription,
    ingredients: recipe.ingredients.map((ingredient, index) => {
      const translated = translation.ingredients?.[index];
      if (!translated) return ingredient;
      return {
        ...ingredient,
        name: translated.name || ingredient.name,
        quantity: translated.quantity || ingredient.quantity,
        unit: translated.unit || ingredient.unit,
        notes: translated.notes || ingredient.notes,
        originalQuantity: ingredient.originalQuantity || translated.originalQuantity || '',
        originalUnit: ingredient.originalUnit || translated.originalUnit || '',
        originalText: ingredient.originalText || translated.originalText || ''
      };
    }),
    steps: recipe.steps.map((step, index) => ({
      ...step,
      ...(translation.steps?.[index] || {}),
      imageUrl: step.imageUrl || translation.steps?.[index]?.imageUrl || '',
      imagePrompt: step.imagePrompt || translation.steps?.[index]?.imagePrompt || ''
    }))
  };
}

function getStoredAuthHeader() {
  try {
    return window.sessionStorage.getItem(AUTH_SESSION_KEY) || '';
  } catch {
    return '';
  }
}

function storeAuthHeader(header) {
  try {
    if (header) window.sessionStorage.setItem(AUTH_SESSION_KEY, header);
    else window.sessionStorage.removeItem(AUTH_SESSION_KEY);
  } catch {
    // Session storage can be unavailable in restricted browser contexts.
  }
}

function encodeBasicAuth(email, password) {
  const bytes = new TextEncoder().encode(`${email}:${password}`);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return `Basic ${window.btoa(binary)}`;
}

function getRoute() {
  const hash = window.location.hash.replace(/^#/, '');
  return hash || '/recipes';
}

function navigate(path) {
  window.location.hash = path;
}

function buildShareUrl(token) {
  return `${window.location.origin}/#/share/${token}`;
}

function useRoute() {
  const [route, setRoute] = useState(getRoute());
  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  return route;
}

function useKeepAwake(enabled) {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return undefined;

    let wakeLock = null;
    let cancelled = false;

    async function acquire() {
      try {
        wakeLock = await navigator.wakeLock.request('screen');
      } catch {
        // Wake locks can be rejected (battery saver, browser policy); keep the app usable.
        wakeLock = null;
      }
    }

    function onVisibilityChange() {
      // The lock is released automatically when the tab is hidden; reacquire on return.
      if (!cancelled && document.visibilityState === 'visible') acquire();
    }

    acquire();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      wakeLock?.release?.().catch(() => {});
      wakeLock = null;
    };
  }, [enabled]);
}

const MAX_UPLOAD_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_UPLOAD_IMAGE_DIMENSION = 1600;

function downscaleImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.onload = () => {
      const image = new window.Image();
      image.onerror = () => reject(new Error('Could not load the selected image'));
      image.onload = () => {
        const scale = Math.min(1, MAX_UPLOAD_IMAGE_DIMENSION / Math.max(image.width, image.height));
        if (scale >= 1 && file.size <= 600000) {
          resolve(String(reader.result));
          return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function minutesLabel(minutes) {
  if (minutes === null || minutes === undefined) return '';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} h ${remainder} min` : `${hours} h`;
}

function numberLabel(value) {
  return new Intl.NumberFormat('en').format(value || 0);
}

function moneyLabel(value) {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 6
  }).format(value || 0);
}

function fileSizeLabel(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function tagNames(recipe) {
  return (recipe.tags || []).map((tag) => (typeof tag === 'string' ? tag : tag.categoryName || tag.name));
}

function MultiSelectDropdown({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = 'Select tags',
  emptyText = 'No tags yet'
}) {
  const optionLabels = new Map(options.map((option) => [option.value, option.label]));
  const selectedLabels = selectedValues.map((value) => ({
    value,
    label: optionLabels.get(value) || value
  }));

  function toggleValue(value) {
    onChange(
      selectedValues.includes(value)
        ? selectedValues.filter((item) => item !== value)
        : [...selectedValues, value]
    );
  }

  return (
    <div className="multi-select-field">
      {label && <span className="multi-select-label">{label}</span>}
      <details className="multi-select-dropdown">
        <summary>
          <span>{selectedValues.length ? `${selectedValues.length} selected` : placeholder}</span>
          <ChevronDown size={17} />
        </summary>
        <div className="multi-select-menu">
          {options.length ? (
            options.map((option) => (
              <label className="multi-select-option" key={option.value}>
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={() => toggleValue(option.value)}
                />
                <span>{option.label}</span>
                {option.count !== undefined && <small>{option.count}</small>}
              </label>
            ))
          ) : (
            <div className="multi-select-empty">{emptyText}</div>
          )}
        </div>
      </details>

      {selectedLabels.length > 0 && (
        <div className="selected-tag-list">
          {selectedLabels.map((item) => (
            <button className="tag-remove-chip" type="button" key={item.value} onClick={() => toggleValue(item.value)}>
              <span>{item.label}</span>
              <X size={14} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ text, checklist = [], actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <div className="empty-state-visual">
        <Utensils size={34} />
      </div>
      <div>
        <h2>{text}</h2>
        <p>Build a clean recipe library by adding, importing, and tagging the recipes you use most.</p>
      </div>
      {checklist.length > 0 && (
        <ol>
          {checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      )}
      {actionLabel && (
        <button className="primary-button" type="button" onClick={onAction}>
          <Plus size={18} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function StatusMessage({ loading, error, empty, emptyText, emptyChecklist, emptyActionLabel, onEmptyAction }) {
  if (loading) {
    return (
      <div className="state">
        <Loader2 className="spin" size={18} />
        Loading
      </div>
    );
  }
  if (error) return <div className="state error">{error}</div>;
  if (empty) {
    return (
      <EmptyState
        text={emptyText}
        checklist={emptyChecklist}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }
  return null;
}

function TimeMeta({ recipe }) {
  const active = minutesLabel(recipe.activeTimeMinutes);
  const total = minutesLabel(recipe.totalTimeMinutes);
  if (!active && !total) return null;

  return (
    <div className="time-meta">
      <Clock3 size={15} />
      {active && <span>Active {active}</span>}
      {total && <span>Total {total}</span>}
    </div>
  );
}

function nutritionRow(value, unit) {
  if (value === null || value === undefined) return '—';
  return `${numberLabel(value)}${unit}`;
}

const MACRO_COLORS = { protein: '#f59e0b', fat: '#a78bfa', carbs: '#38bdf8' };

function polarToXY(cx, cy, radius, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
}

// Inline SVG pie of the protein/fat/carbs mix by mass. No chart dependency so
// it renders identically on screen and in the shared-recipe PDF.
function MacroPie({ macros }) {
  const { t } = useI18n();
  const slices = [
    { key: 'protein', label: t('protein'), value: macros.protein || 0, color: MACRO_COLORS.protein },
    { key: 'fat', label: t('fat'), value: macros.fat || 0, color: MACRO_COLORS.fat },
    { key: 'carbs', label: t('carbs'), value: macros.carbs || 0, color: MACRO_COLORS.carbs }
  ].filter((slice) => slice.value > 0);

  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  if (!total) {
    return <p className="muted-note macro-empty">{t('macroSplitEmpty')}</p>;
  }

  const cx = 60;
  const cy = 60;
  const radius = 54;
  const withPct = slices.map((slice) => ({ ...slice, pct: Math.round((slice.value / total) * 100) }));

  let cursor = -90;
  const shapes = withPct.map((slice) => {
    if (withPct.length === 1) {
      return (
        <circle key={slice.key} cx={cx} cy={cy} r={radius} fill={slice.color} />
      );
    }
    const sweep = (slice.value / total) * 360;
    const start = cursor;
    const end = cursor + sweep;
    cursor = end;
    const [x1, y1] = polarToXY(cx, cy, radius, start);
    const [x2, y2] = polarToXY(cx, cy, radius, end);
    const largeArc = sweep > 180 ? 1 : 0;
    const d = `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
    return <path key={slice.key} d={d} fill={slice.color} />;
  });

  return (
    <div className="nutrition-chart">
      <p className="macro-title">{t('macroSplit')}</p>
      <svg viewBox="0 0 120 120" className="macro-pie" role="img" aria-label={t('macroSplit')}>
        {shapes}
      </svg>
      <ul className="macro-legend">
        {withPct.map((slice) => (
          <li key={slice.key}>
            <span className="macro-dot" style={{ background: slice.color }} />
            <span className="macro-legend-label">{slice.label}</span>
            <span className="macro-legend-value">
              {numberLabel(slice.value)} g · {slice.pct}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NutritionCard({ nutrition }) {
  const { t } = useI18n();
  if (!nutrition) return null;

  const rows = [
    { key: 'calories', label: t('calories'), unit: ' kcal' },
    { key: 'proteinGrams', label: t('protein'), unit: ' g' },
    { key: 'carbsGrams', label: t('carbs'), unit: ' g' },
    { key: 'fatGrams', label: t('fat'), unit: ' g' },
    { key: 'fiberGrams', label: t('fiber'), unit: ' g' },
    { key: 'sugarGrams', label: t('sugar'), unit: ' g' },
    { key: 'sodiumMg', label: t('sodium'), unit: ' mg' }
  ];
  const perServing = nutrition.perServing || {};
  const total = nutrition.total || {};
  const macroBase = [perServing.proteinGrams, perServing.fatGrams, perServing.carbsGrams].some(
    (value) => value !== null && value !== undefined
  )
    ? perServing
    : total;
  const macros = {
    protein: macroBase.proteinGrams,
    fat: macroBase.fatGrams,
    carbs: macroBase.carbsGrams
  };

  return (
    <div className="nutrition-card">
      {nutrition.servings ? (
        <p className="muted-note">
          {t('servingsLabel')}: {numberLabel(nutrition.servings)}
        </p>
      ) : null}
      <div className="nutrition-body">
        <div className="nutrition-table">
          <div className="nutrition-table-header">
            <span>{t('nutrition')}</span>
            <span>{t('perServing')}</span>
            <span>{t('wholeRecipe')}</span>
          </div>
          {rows.map((row) => (
            <div className="nutrition-table-row" key={row.key}>
              <span>{row.label}</span>
              <span>{nutritionRow(perServing[row.key], row.unit)}</span>
              <span>{nutritionRow(total[row.key], row.unit)}</span>
            </div>
          ))}
        </div>
        <MacroPie macros={macros} />
      </div>
    </div>
  );
}

function LlmUsageCard({ usage }) {
  const { t } = useI18n();
  if (!usage) return null;

  return (
    <section className="content-block usage-card">
      <p className="eyebrow">{t('importStats')}</p>
      <h2>{t('aiImportUsage')}</h2>
      <div className="metric-grid">
        <div>
          <span>{t('model')}</span>
          <strong>{usage.model}</strong>
        </div>
        <div>
          <span>{t('inputTokens')}</span>
          <strong>{numberLabel(usage.inputTokens)}</strong>
        </div>
        <div>
          <span>{t('outputTokens')}</span>
          <strong>{numberLabel(usage.outputTokens)}</strong>
        </div>
        <div>
          <span>{t('responseTime')}</span>
          <strong>{numberLabel(usage.responseMs)} ms</strong>
        </div>
        <div>
          <span>{t('estimatedCost')}</span>
          <strong>{moneyLabel(usage.totalCostUsd)}</strong>
        </div>
        {usage.imageCount > 0 && (
          <div>
            <span>{t('stepImages')}</span>
            <strong>
              {numberLabel(usage.imageCount)} · {moneyLabel(usage.imageCostUsd)}
            </strong>
          </div>
        )}
      </div>
    </section>
  );
}

function RecipeImage({ recipe }) {
  if (recipe.imageUrl) {
    return <img src={recipe.imageUrl} alt="" loading="lazy" />;
  }

  return (
    <div className="image-placeholder" aria-hidden="true">
      <Utensils size={32} />
    </div>
  );
}

function RecipeCard({ recipe }) {
  const { language } = useI18n();
  const shownRecipe = displayRecipe(recipe, language);
  const shownTags = translatedTags(recipe, language);

  return (
    <a className="recipe-card" href={`#/recipes/${recipe.id}`}>
      <div className="recipe-card-image">
        <RecipeImage recipe={recipe} />
      </div>
      <div className="recipe-card-body">
        <h3>{shownRecipe.title}</h3>
        <p>{shownRecipe.shortDescription || 'No short description yet.'}</p>
        <TimeMeta recipe={recipe} />
        <div className="tag-row">
          {shownTags
            .slice(0, 4)
            .map((tag) => (
              <span className="tag-chip" key={tag}>
                {tag}
              </span>
            ))}
        </div>
      </div>
    </a>
  );
}

function AppNav({ route, managementUnlocked, onManagementSignOut }) {
  const { t } = useI18n();
  const items = [
    { path: '/recipes', label: t('recipes'), icon: Utensils },
    { path: '/add', label: t('addRecipe'), icon: Plus },
    { path: '/import', label: t('importRecipe'), icon: LinkIcon },
    { path: '/tags', label: t('tagsSearch'), icon: Tags },
    { path: '/settings', label: t('settings'), icon: Settings },
    ...(isAdminUser ? [{ path: '/saas', label: t('saasManagement'), icon: ShieldCheck }] : [])
  ];

  return (
    <aside className="sidebar">
      <a className="brand" href="#/recipes">
        <span className="brand-mark">TL</span>
        <span>
          <strong>Recipe Core</strong>
          <small>Techlotse internal</small>
        </span>
      </a>
      <nav className="nav-list" aria-label="Primary">
        {items.map((item) => {
          const Icon = item.icon;
          const active = route === item.path || (item.path === '/recipes' && route.startsWith('/recipes/'));
          return (
            <a className={`nav-item ${active ? 'active' : ''}`} href={`#${item.path}`} key={item.path}>
              <Icon size={18} />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
      <div className="sidebar-account">
        <div className="account-avatar">
          <ShieldCheck size={17} />
        </div>
        <div>
          <strong>{managementUnlocked ? t('managementUnlocked') : t('publicBrowsing')}</strong>
          <small>{managementUnlocked ? t('basicAuthActive') : t('signInWhenNeeded')}</small>
        </div>
        {managementUnlocked && (
          <button className="icon-button account-signout" type="button" title="Sign out" onClick={onManagementSignOut}>
            <X size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}

function RecipesPage() {
  const { preferences, language, t } = useI18n();
  const [recipes, setRecipes] = useState([]);
  const [tags, setTags] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([
      api.listRecipes({ search, tags: selectedTags, categories: selectedCategories }),
      api.listTags()
    ])
      .then(([recipesPayload, tagsPayload]) => {
        if (!active) return;
        setRecipes(recipesPayload.recipes);
        setTags(tagsPayload.tags);
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [search, selectedTags, selectedCategories]);

  return (
    <section className="view">
      <div className="view-header">
        <div>
          <p className="eyebrow">Recipes</p>
          <h1>{t('recipeLibrary')}</h1>
        </div>
        <button className="primary-button" type="button" onClick={() => navigate('/add')}>
          <Plus size={18} />
          {t('add')}
        </button>
      </div>

      <div className="toolbar search-filter-toolbar">
        <label className="search-box">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('searchPlaceholder')}
          />
        </label>
        <MultiSelectDropdown
          label={t('categories')}
          options={(preferences.categoryFilters || []).map((category) => ({
            value: category,
            label: translateCategoryName(category, language)
          }))}
          selectedValues={selectedCategories}
          onChange={setSelectedCategories}
          placeholder={t('allCategories')}
          emptyText="No categories configured"
        />
        <MultiSelectDropdown
          label={t('tags')}
          options={tags
            .filter((tag) => !tag.isCategory)
            .map((tag) => ({
              value: tag.slug,
              label: tag.name,
              count: tag.recipeCount
            }))}
          selectedValues={selectedTags}
          onChange={setSelectedTags}
          placeholder={t('allTags')}
          emptyText="No tags available"
        />
      </div>

      <StatusMessage
        loading={loading}
        error={error}
        empty={!recipes.length}
        emptyText={t('noRecipesFound')}
        emptyChecklist={['Add a recipe manually', 'Import from a URL or photos', 'Tag recipes for faster filtering']}
        emptyActionLabel="Add recipe"
        onEmptyAction={() => navigate('/add')}
      />

      <div className="recipe-grid">
        {recipes.map((recipe) => (
          <RecipeCard recipe={recipe} key={recipe.id} />
        ))}
      </div>
    </section>
  );
}

function RecipeDetailPage({ id }) {
  const { preferences, t } = useI18n();
  const [recipe, setRecipe] = useState(null);
  const [recipeLanguage, setRecipeLanguage] = useState('original');
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState('');
  const [translationError, setTranslationError] = useState('');
  const [enlargedPhoto, setEnlargedPhoto] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareEnabled, setShareEnabled] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareError, setShareError] = useState('');
  const [shareCopied, setShareCopied] = useState(false);
  const [shareExpiry, setShareExpiry] = useState('');
  const [shareExpiresAt, setShareExpiresAt] = useState(null);
  const [nutritionBusy, setNutritionBusy] = useState(false);
  const [nutritionError, setNutritionError] = useState('');
  const [checkedIngredients, setCheckedIngredients] = useState(() => new Set());
  const [completedSteps, setCompletedSteps] = useState(() => new Set());

  useEffect(() => {
    let active = true;
    setLoading(true);
    setCheckedIngredients(new Set());
    setCompletedSteps(new Set());
    api
      .getRecipe(id)
      .then((payload) => {
        if (!active) return;
        setRecipe(payload.recipe);
        setShareEnabled(Boolean(payload.recipe?.shareEnabled));
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  function toggleSetItem(setter, index) {
    setter((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function openShare() {
    setShareOpen(true);
    setShareError('');
    setShareCopied(false);
    // Start each share session from the chooser; default is no expiry.
    setShareUrl('');
    setShareExpiresAt(null);
    setShareExpiry('');
  }

  async function createShareLink() {
    setShareBusy(true);
    setShareError('');
    try {
      const payload = await api.enableRecipeShare(id, {
        expiresInHours: shareExpiry ? Number(shareExpiry) : null
      });
      setShareUrl(buildShareUrl(payload.shareToken));
      setShareExpiresAt(payload.shareExpiresAt || null);
      setShareEnabled(true);
    } catch (err) {
      setShareError(err.message);
    } finally {
      setShareBusy(false);
    }
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2000);
    } catch {
      setShareError('Could not copy the link. Select and copy it manually.');
    }
  }

  async function nativeShare() {
    if (!navigator.share) return;
    try {
      await navigator.share({ title: recipe.title, url: shareUrl });
    } catch {
      // User dismissed the share sheet — nothing to do.
    }
  }

  async function stopSharing() {
    setShareBusy(true);
    setShareError('');
    try {
      await api.disableRecipeShare(id);
      setShareEnabled(false);
      setShareUrl('');
      setShareExpiresAt(null);
      setShareOpen(false);
    } catch (err) {
      setShareError(err.message);
    } finally {
      setShareBusy(false);
    }
  }

  async function calculateNutrition() {
    setNutritionBusy(true);
    setNutritionError('');
    try {
      const payload = await api.calculateNutrition(id);
      setRecipe(payload.recipe);
    } catch (err) {
      setNutritionError(err.message);
    } finally {
      setNutritionBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this recipe?')) return;
    await api.deleteRecipe(id);
    navigate('/recipes');
  }

  async function generateMissingTranslations() {
    const missingLanguages = languageOptions(preferences)
      .map((option) => option.code)
      .filter((code) => !recipe.translations?.[code]);
    if (!missingLanguages.length) return;

    setTranslating(true);
    setTranslationError('');
    try {
      const payload = await api.translateRecipe(recipe.id, missingLanguages);
      setRecipe(payload.recipe);
      if (recipeLanguage === 'original' && payload.translatedLanguages?.[0]) {
        setRecipeLanguage(payload.translatedLanguages[0]);
      }
    } catch (err) {
      setTranslationError(err.message);
    } finally {
      setTranslating(false);
    }
  }

  if (loading || error || !recipe) {
    return (
      <section className="view">
        <StatusMessage loading={loading} error={error} empty={!recipe && !loading && !error} emptyText="Recipe not found." />
      </section>
    );
  }

  const selectedRecipeLanguage = recipeLanguage === 'original' ? 'original' : recipeLanguage;
  const shownRecipe = displayRecipe(recipe, selectedRecipeLanguage);
  const shownTags = translatedTags(recipe, selectedRecipeLanguage);
  const missingSelectedTranslation =
    recipeLanguage !== 'original' && !recipe.translations?.[recipeLanguage];
  const missingTranslationCount = languageOptions(preferences).filter(
    (option) => !recipe.translations?.[option.code]
  ).length;

  return (
    <section className="view detail-view">
      <div className="view-header">
        <button className="ghost-button" type="button" onClick={() => navigate('/recipes')}>
          <ArrowLeft size={18} />
          {t('recipes')}
        </button>
        <div className="header-actions">
          <button className="secondary-button" type="button" onClick={openShare}>
            <Share2 size={18} />
            {t('share')}
          </button>
          <button className="secondary-button" type="button" onClick={() => navigate(`/recipes/${recipe.id}/edit`)}>
            <Settings size={18} />
            {t('edit')}
          </button>
          <button className="danger-button" type="button" onClick={handleDelete}>
            <Trash2 size={18} />
            {t('delete')}
          </button>
        </div>
      </div>

      <div className="detail-hero">
        <div className="detail-image">
          <RecipeImage recipe={recipe} />
        </div>
        <div className="detail-copy">
          <p className="eyebrow">{recipe.importMode === 'manual' ? t('manualRecipe') : `${recipe.importMode} import`}</p>
          <h1>{shownRecipe.title}</h1>
          <p>{shownRecipe.shortDescription || 'No short description yet.'}</p>
          <TimeMeta recipe={recipe} />
          <div className="tag-row">
            {shownTags.map((tag) => (
              <span className="tag-chip" key={tag}>
                {tag}
              </span>
            ))}
          </div>
          <div className="translation-panel">
            <label className="field compact-field">
              <span>{t('recipeLanguage')}</span>
              <select value={recipeLanguage} onChange={(event) => setRecipeLanguage(event.target.value)}>
                <option value="original">{t('originalRecipe')}</option>
                {languageOptions(preferences).map((option) => (
                  <option value={option.code} key={option.code}>
                    {option.label}
                    {recipe.translations?.[option.code] ? '' : ' (missing)'}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="secondary-button"
              type="button"
              onClick={generateMissingTranslations}
              disabled={translating || missingTranslationCount === 0}
            >
              {translating ? <Loader2 className="spin" size={18} /> : <Languages size={18} />}
              {t('generateMissingTranslations')}
            </button>
          </div>
          {missingSelectedTranslation && <div className="state compact">{t('translationMissing')}</div>}
          {translationError && <div className="state error compact">{translationError}</div>}
          <div className="source-links">
            {recipe.sourceUrl && (
              <a className="source-link" href={recipe.sourceUrl} target="_blank" rel="noreferrer">
                <LinkIcon size={16} />
                {t('sourceRecipe')}
              </a>
            )}
            {recipe.videoUrl && (
              <a className="source-link" href={recipe.videoUrl} target="_blank" rel="noreferrer">
                <Video size={16} />
                {t('recipeVideo')}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <section className="content-block">
          <h2>{t('ingredients')}</h2>
          <ul className="ingredient-list interactive">
            {shownRecipe.ingredients.map((ingredient, index) => (
              <li
                className={checkedIngredients.has(index) ? 'checked' : ''}
                onClick={() => toggleSetItem(setCheckedIngredients, index)}
                key={`${ingredient.name}-${index}`}
              >
                <strong>
                  {[ingredient.quantity, ingredient.unit].filter(Boolean).join(' ')}
                  {ingredient.quantity || ingredient.unit ? ' ' : ''}
                  {ingredient.name}
                </strong>
                {(ingredient.originalText || ingredient.originalQuantity || ingredient.originalUnit) && (
                  <span>
                    {t('original')}:{' '}
                    {ingredient.originalText ||
                      [ingredient.originalQuantity, ingredient.originalUnit].filter(Boolean).join(' ')}
                  </span>
                )}
                {ingredient.notes && <span>{ingredient.notes}</span>}
              </li>
            ))}
          </ul>
        </section>

        <section className="content-block">
          <h2>{t('method')}</h2>
          <ol className="step-list">
            {shownRecipe.steps.map((step, index) => (
              <li
                className={[step.imageUrl ? 'illustrated-step' : '', completedSteps.has(index) ? 'done' : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => toggleSetItem(setCompletedSteps, index)}
                key={`${step.text}-${index}`}
              >
                {step.imageUrl && <img src={step.imageUrl} alt="" loading="lazy" />}
                <span>{step.text}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="content-block nutrition-section">
        <div className="nutrition-action-row">
          <div>
            <p className="eyebrow">{t('nutrition')}</p>
            <h2>{t('nutritionTitle')}</h2>
          </div>
          <button className="secondary-button" type="button" onClick={calculateNutrition} disabled={nutritionBusy}>
            {nutritionBusy ? <Loader2 className="spin" size={18} /> : <Gauge size={18} />}
            {recipe.nutrition ? t('recalculateNutrition') : t('calculateNutrition')}
          </button>
        </div>
        {nutritionError && <div className="state error compact">{nutritionError}</div>}
        {recipe.nutrition ? (
          <>
            <NutritionCard nutrition={recipe.nutrition} />
            <p className="nutrition-disclaimer">{t('nutritionDisclaimer')}</p>
          </>
        ) : (
          !nutritionBusy && <p className="muted-note">{t('nutritionDisclaimer')}</p>
        )}
      </section>

      {recipe.sourcePhotos?.length > 0 && (
        <section className="content-block">
          <h2>{t('importPhotos')}</h2>
          <p className="muted-note">{t('importPhotosHint')}</p>
          <div className="source-photo-grid">
            {recipe.sourcePhotos.map((photo, index) => (
              <button
                className="source-photo"
                type="button"
                key={`${photo.name}-${index}`}
                title={photo.name || `Import photo ${index + 1}`}
                onClick={() => setEnlargedPhoto(photo)}
              >
                <img src={photo.dataUrl} alt={photo.name || `Import photo ${index + 1}`} loading="lazy" />
              </button>
            ))}
          </div>
        </section>
      )}

      {recipe.sourceSnapshot && (
        <section className="content-block">
          <details className="saved-source">
            <summary>
              <ScrollText size={16} />
              {t('savedSource')}
            </summary>
            <p className="muted-note">{t('savedSourceHint')}</p>
            <p className="saved-source-text">{recipe.sourceSnapshot}</p>
          </details>
        </section>
      )}

      <LlmUsageCard usage={recipe.llmUsage} />

      {shareOpen && (
        <div className="auth-overlay" onClick={() => setShareOpen(false)}>
          <div
            className="auth-dialog share-dialog"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="icon-button auth-close" type="button" title="Close" onClick={() => setShareOpen(false)}>
              <X size={17} />
            </button>
            <div className="auth-dialog-icon">
              <Share2 size={24} />
            </div>
            <p className="eyebrow">{t('share')}</p>
            <h2>{t('shareRecipe')}</h2>
            <p>{t('shareHint')}</p>
            {!shareUrl ? (
              <div className="share-create">
                <label className="field compact-field">
                  <span>{t('shareExpiry')}</span>
                  <select value={shareExpiry} onChange={(event) => setShareExpiry(event.target.value)} disabled={shareBusy}>
                    <option value="">{t('expiryNone')}</option>
                    <option value="1">{t('expiry1h')}</option>
                    <option value="24">{t('expiry24h')}</option>
                    <option value="168">{t('expiry7d')}</option>
                    <option value="720">{t('expiry30d')}</option>
                  </select>
                </label>
                <button className="primary-button" type="button" onClick={createShareLink} disabled={shareBusy}>
                  {shareBusy ? <Loader2 className="spin" size={18} /> : <Share2 size={18} />}
                  {t('createLink')}
                </button>
              </div>
            ) : (
              <>
                <div className="share-link-row">
                  <input readOnly value={shareUrl} onFocus={(event) => event.target.select()} />
                  <button className="secondary-button" type="button" onClick={copyShareLink}>
                    {shareCopied ? <Check size={18} /> : <Copy size={18} />}
                    {shareCopied ? t('linkCopied') : t('copyLink')}
                  </button>
                </div>
                <p className="share-expiry-note">
                  {shareExpiresAt
                    ? `${t('expiresOn')} ${new Date(shareExpiresAt).toLocaleString()}`
                    : t('neverExpires')}
                </p>
                <div className="share-actions">
                  {typeof navigator !== 'undefined' && navigator.share && (
                    <button className="secondary-button" type="button" onClick={nativeShare}>
                      <Share2 size={18} />
                      {t('shareViaApps')}
                    </button>
                  )}
                  <a className="secondary-button" href={shareUrl} target="_blank" rel="noreferrer">
                    <Printer size={18} />
                    {t('saveAsPdf')}
                  </a>
                  <button className="ghost-button" type="button" onClick={stopSharing} disabled={shareBusy}>
                    <X size={18} />
                    {t('stopSharing')}
                  </button>
                </div>
              </>
            )}
            {shareError && <div className="state error compact">{shareError}</div>}
          </div>
        </div>
      )}

      {enlargedPhoto && (
        <div className="photo-lightbox" role="dialog" aria-modal="true" onClick={() => setEnlargedPhoto(null)}>
          <button className="icon-button lightbox-close" type="button" title="Close" onClick={() => setEnlargedPhoto(null)}>
            <X size={18} />
          </button>
          <img src={enlargedPhoto.dataUrl} alt={enlargedPhoto.name || 'Import photo'} />
        </div>
      )}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function ManagementLoginDialog({ challenge, onSubmit, onCancel }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (challenge) setPassword('');
  }, [challenge]);

  if (!challenge) return null;

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(email.trim(), password);
  }

  return (
    <div className="auth-overlay">
      <form
        className="auth-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="management-login-title"
        onSubmit={handleSubmit}
      >
        <button className="icon-button auth-close" type="button" title="Cancel" onClick={onCancel}>
          <X size={17} />
        </button>
        <div className="auth-dialog-icon">
          <KeyRound size={24} />
        </div>
        <p className="eyebrow">Management access</p>
        <h2 id="management-login-title">Sign in to continue</h2>
        <p>Settings, imports, backups, and recipe changes require the configured management credentials.</p>
        {challenge.invalid && <div className="state error compact">Credentials were rejected. Try again.</div>}
        <Field label="Email">
          <input
            type="email"
            autoComplete="username"
            autoFocus
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@example.com"
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <div className="form-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="primary-button" type="submit" disabled={!email.trim() || !password}>
            <KeyRound size={18} />
            Sign in
          </button>
        </div>
      </form>
    </div>
  );
}

function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function AddRecipePage({ recipeId = null }) {
  const { preferences, language } = useI18n();
  const steps = ['Basic info', 'Ingredients', 'Method', 'Tags', 'Review'];
  const isEditing = Boolean(recipeId);
  const [stepIndex, setStepIndex] = useState(0);
  const [loadingRecipe, setLoadingRecipe] = useState(Boolean(recipeId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [existingTags, setExistingTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [recipe, setRecipe] = useState({
    title: '',
    shortDescription: '',
    imageUrl: '',
    activeTimeMinutes: '',
    totalTimeMinutes: '',
    ingredients: [{ ...emptyIngredient }],
    steps: [{ ...emptyStep }],
    tags: [],
    translations: {},
    sourceUrl: '',
    videoUrl: '',
    importMode: 'manual'
  });

  useEffect(() => {
    let active = true;
    setLoadingRecipe(Boolean(recipeId));

    Promise.all([api.listTags(), recipeId ? api.getRecipe(recipeId) : Promise.resolve(null)])
      .then(([tagPayload, recipePayload]) => {
        if (!active) return;
        setExistingTags(tagPayload.tags);

        if (recipePayload?.recipe) {
          const loaded = recipePayload.recipe;
          setRecipe({
            title: loaded.title,
            shortDescription: loaded.shortDescription || '',
            imageUrl: loaded.imageUrl || '',
            activeTimeMinutes: loaded.activeTimeMinutes ?? '',
            totalTimeMinutes: loaded.totalTimeMinutes ?? '',
            // Remember the loaded quantity/unit per row so edits can show "(original ...)".
            ingredients: (loaded.ingredients?.length ? loaded.ingredients : [{ ...emptyIngredient }]).map(
              (item) => ({ ...item, _loadedQuantity: item.quantity, _loadedUnit: item.unit })
            ),
            steps: loaded.steps?.length ? loaded.steps : [{ ...emptyStep }],
            tags: tagNames(loaded),
            translations: loaded.translations || {},
            sourceUrl: loaded.sourceUrl || '',
            videoUrl: loaded.videoUrl || '',
            importMode: loaded.importMode || 'manual'
          });
        }
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoadingRecipe(false));

    return () => {
      active = false;
    };
  }, [recipeId]);

  const canGoNext = useMemo(() => {
    if (stepIndex === 0) return recipe.title.trim().length >= 2;
    if (stepIndex === 1) return recipe.ingredients.some((item) => item.name.trim());
    if (stepIndex === 2) return recipe.steps.some((item) => item.text.trim());
    return true;
  }, [recipe, stepIndex]);

  function updateRecipe(field, value) {
    setRecipe((current) => ({ ...current, [field]: value }));
  }

  function updateArrayItem(field, index, key, value) {
    setRecipe((current) => ({
      ...current,
      [field]: current[field].map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      )
    }));
  }

  function addArrayItem(field, item) {
    setRecipe((current) => ({ ...current, [field]: [...current[field], item] }));
  }

  function removeArrayItem(field, index) {
    setRecipe((current) => ({
      ...current,
      [field]: current[field].filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  function addNewTag() {
    const cleaned = newTag.trim();
    if (!cleaned) return;
    setRecipe((current) => ({
      ...current,
      tags: current.tags.includes(cleaned) ? current.tags : [...current.tags, cleaned]
    }));
    setNewTag('');
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_UPLOAD_IMAGE_BYTES) {
      setError('Image uploads are limited to 8 MB.');
      return;
    }
    try {
      setError('');
      updateRecipe('imageUrl', await downscaleImageFile(file));
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveRecipe() {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...recipe,
        activeTimeMinutes: toNumberOrNull(recipe.activeTimeMinutes),
        totalTimeMinutes: toNumberOrNull(recipe.totalTimeMinutes),
        ingredients: recipe.ingredients
          .filter((item) => item.name.trim())
          .map(({ _loadedQuantity, _loadedUnit, ...item }) => {
            const amountChanged =
              _loadedQuantity !== undefined &&
              (item.quantity !== _loadedQuantity || item.unit !== _loadedUnit);
            if (amountChanged && !item.originalQuantity && !item.originalUnit && (_loadedQuantity || _loadedUnit)) {
              return { ...item, originalQuantity: _loadedQuantity, originalUnit: _loadedUnit };
            }
            return item;
          }),
        steps: recipe.steps.filter((item) => item.text.trim())
      };
      const result = isEditing ? await api.updateRecipe(recipeId, payload) : await api.createRecipe(payload);
      navigate(`/recipes/${result.recipe.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loadingRecipe) {
    return (
      <section className="view">
        <StatusMessage loading={loadingRecipe} />
      </section>
    );
  }

  return (
    <section className="view">
      <div className="view-header">
        <div>
          <p className="eyebrow">{isEditing ? 'Edit Recipe' : 'Add Recipe'}</p>
          <h1>{isEditing ? 'Edit recipe' : 'Manual recipe wizard'}</h1>
        </div>
      </div>

      <div className="wizard-steps" aria-label="Recipe wizard progress">
        {steps.map((step, index) => (
          <button
            className={index === stepIndex ? 'active' : index < stepIndex ? 'complete' : ''}
            type="button"
            key={step}
            onClick={() => setStepIndex(index)}
          >
            {index < stepIndex ? <Check size={15} /> : index + 1}
            <span>{step}</span>
          </button>
        ))}
      </div>

      {error && <div className="state error">{error}</div>}

      <div className="surface">
        {stepIndex === 0 && (
          <div className="form-grid">
            <Field label="Title">
              <input value={recipe.title} onChange={(event) => updateRecipe('title', event.target.value)} />
            </Field>
            <Field label="Short description">
              <textarea
                value={recipe.shortDescription}
                onChange={(event) => updateRecipe('shortDescription', event.target.value)}
              />
            </Field>
            <Field label="Image URL">
              <input value={recipe.imageUrl} onChange={(event) => updateRecipe('imageUrl', event.target.value)} />
            </Field>
            <Field label="Image upload">
              <span className="file-input">
                <Image size={17} />
                <input type="file" accept="image/*" onChange={handleImageUpload} />
              </span>
            </Field>
            <Field label="Active time (minutes)">
              <input
                type="number"
                min="0"
                value={recipe.activeTimeMinutes}
                onChange={(event) => updateRecipe('activeTimeMinutes', event.target.value)}
              />
            </Field>
            <Field label="Total time (minutes)">
              <input
                type="number"
                min="0"
                value={recipe.totalTimeMinutes}
                onChange={(event) => updateRecipe('totalTimeMinutes', event.target.value)}
              />
            </Field>
            <Field label="Video URL">
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=…"
                value={recipe.videoUrl}
                onChange={(event) => updateRecipe('videoUrl', event.target.value)}
              />
            </Field>
          </div>
        )}

        {stepIndex === 1 && (
          <div className="stack">
            {recipe.ingredients.map((ingredient, index) => {
              const loadedAmountLabel = [ingredient._loadedQuantity, ingredient._loadedUnit]
                .filter(Boolean)
                .join(' ');
              const amountChanged =
                isEditing &&
                ingredient._loadedQuantity !== undefined &&
                Boolean(loadedAmountLabel) &&
                (ingredient.quantity !== ingredient._loadedQuantity || ingredient.unit !== ingredient._loadedUnit);

              return (
              <div className="line-item ingredient-row" key={index}>
                <input
                  placeholder="Ingredient"
                  value={ingredient.name}
                  onChange={(event) => updateArrayItem('ingredients', index, 'name', event.target.value)}
                />
                <input
                  placeholder="Quantity"
                  value={ingredient.quantity}
                  onChange={(event) => updateArrayItem('ingredients', index, 'quantity', event.target.value)}
                />
                <input
                  placeholder="Unit"
                  value={ingredient.unit}
                  onChange={(event) => updateArrayItem('ingredients', index, 'unit', event.target.value)}
                />
                <input
                  placeholder="Notes"
                  value={ingredient.notes}
                  onChange={(event) => updateArrayItem('ingredients', index, 'notes', event.target.value)}
                />
                {amountChanged && <div className="original-value edited-hint">(original {loadedAmountLabel})</div>}
                {(ingredient.originalText || ingredient.originalQuantity || ingredient.originalUnit) && (
                  <div className="original-value">
                    Original:{' '}
                    {ingredient.originalText ||
                      [ingredient.originalQuantity, ingredient.originalUnit].filter(Boolean).join(' ')}
                  </div>
                )}
                <button
                  className="icon-button"
                  type="button"
                  title="Remove ingredient"
                  onClick={() => removeArrayItem('ingredients', index)}
                  disabled={recipe.ingredients.length === 1}
                >
                  <Trash2 size={17} />
                </button>
              </div>
              );
            })}
            <button className="secondary-button" type="button" onClick={() => addArrayItem('ingredients', { ...emptyIngredient })}>
              <Plus size={18} />
              Add ingredient
            </button>
          </div>
        )}

        {stepIndex === 2 && (
          <div className="stack">
            {recipe.steps.map((step, index) => (
              <div className="line-item method-row" key={index}>
                <span className="step-number">{index + 1}</span>
                <textarea
                  value={step.text}
                  onChange={(event) => updateArrayItem('steps', index, 'text', event.target.value)}
                  placeholder="Describe this step"
                />
                <button
                  className="icon-button"
                  type="button"
                  title="Remove step"
                  onClick={() => removeArrayItem('steps', index)}
                  disabled={recipe.steps.length === 1}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
            <button className="secondary-button" type="button" onClick={() => addArrayItem('steps', { ...emptyStep })}>
              <Plus size={18} />
              Add step
            </button>
          </div>
        )}

        {stepIndex === 3 && (
          <div className="stack">
            <MultiSelectDropdown
              label="Existing tags"
              options={[
                ...(preferences.categoryFilters || []).map((category) => ({
                  value: category,
                  label: translateCategoryName(category, language)
                })),
                ...existingTags
                  .filter((tag) => !tag.isCategory)
                  .map((tag) => ({ value: tag.name, label: tag.name, count: tag.recipeCount }))
              ]}
              selectedValues={recipe.tags}
              onChange={(values) => updateRecipe('tags', values)}
              placeholder="Select tags"
              emptyText="No tags available"
            />
            <div className="inline-form">
              <input value={newTag} onChange={(event) => setNewTag(event.target.value)} placeholder="New tag" />
              <button className="secondary-button" type="button" onClick={addNewTag}>
                <Plus size={18} />
                Create
              </button>
            </div>
          </div>
        )}

        {stepIndex === 4 && (
          <div className="review-layout">
            <div>
              <p className="eyebrow">Review</p>
              <h2>{recipe.title || 'Untitled recipe'}</h2>
              <p>{recipe.shortDescription || 'No short description.'}</p>
              <TimeMeta
                recipe={{
                  activeTimeMinutes: toNumberOrNull(recipe.activeTimeMinutes),
                  totalTimeMinutes: toNumberOrNull(recipe.totalTimeMinutes)
                }}
              />
              <div className="tag-row">
                {recipe.tags.map((tag) => (
                  <span className="tag-chip" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="review-counts">
              <span>{recipe.ingredients.filter((item) => item.name.trim()).length} ingredients</span>
              <span>{recipe.steps.filter((item) => item.text.trim()).length} steps</span>
            </div>
          </div>
        )}
      </div>

      <div className="wizard-actions">
        <button className="ghost-button" type="button" disabled={stepIndex === 0} onClick={() => setStepIndex(stepIndex - 1)}>
          <ArrowLeft size={18} />
          Back
        </button>
        {stepIndex < steps.length - 1 ? (
          <button
            className="primary-button"
            type="button"
            disabled={!canGoNext}
            onClick={() => setStepIndex(stepIndex + 1)}
          >
            Next
            <ArrowRight size={18} />
          </button>
        ) : (
          <button className="primary-button" type="button" disabled={saving} onClick={saveRecipe}>
            {saving ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
            {isEditing ? 'Update recipe' : 'Save recipe'}
          </button>
        )}
      </div>
    </section>
  );
}

function ImportPage() {
  const { preferences, t } = useI18n();
  const [sourceType, setSourceType] = useState('url');
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState('verbatim');
  const [photos, setPhotos] = useState([]);
  const [translationLanguages, setTranslationLanguages] = useState(FALLBACK_LANGUAGE_OPTIONS.map((option) => option.code));
  const [createToddlerVersion, setCreateToddlerVersion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState([]);

  function chooseSource(nextSourceType) {
    setSourceType(nextSourceType);
    setError('');
    setWarnings([]);
    if (nextSourceType === 'photos') {
      setMode('ai');
    }
  }

  function readPhotoFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve({
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: String(reader.result || '')
        });
      reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
      reader.readAsDataURL(file);
    });
  }

  async function handlePhotoUpload(event) {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    if (!selected.length) return;

    if (photos.length + selected.length > MAX_IMPORT_PHOTOS) {
      setError(`Photo import supports up to ${MAX_IMPORT_PHOTOS} photos.`);
      return;
    }

    const invalidType = selected.find((file) => !IMPORT_PHOTO_TYPES.has(file.type));
    if (invalidType) {
      setError('Photo import supports PNG, JPEG, and WebP images.');
      return;
    }

    const oversized = selected.find((file) => file.size > MAX_IMPORT_PHOTO_BYTES);
    if (oversized) {
      setError(`Each photo must be ${fileSizeLabel(MAX_IMPORT_PHOTO_BYTES)} or smaller.`);
      return;
    }

    setError('');
    try {
      const uploaded = await Promise.all(selected.map(readPhotoFile));
      setPhotos((current) => [...current, ...uploaded]);
    } catch (err) {
      setError(err.message);
    }
  }

  function removePhoto(index) {
    setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index));
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setWarnings([]);
    try {
      const result =
        sourceType === 'photos'
          ? await api.importPhotos({
              photos: photos.map(({ name, type, dataUrl }) => ({ name, type, dataUrl })),
              createToddlerVersion,
              translationLanguages
            })
          : await api.importUrl({
              url,
              mode,
              createToddlerVersion: mode === 'ai' && createToddlerVersion,
              translationLanguages: mode === 'ai' ? translationLanguages : []
            });
      setWarnings(result.warnings || []);
      navigate(`/recipes/${result.recipe.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="view">
      <div className="view-header">
        <div>
          <p className="eyebrow">Import recipe</p>
          <h1>Save a recipe from the web or photos</h1>
        </div>
      </div>

      <form className="surface stack" onSubmit={submit}>
        <div className="option-grid">
          <button
            className={`option-card ${sourceType === 'url' ? 'selected' : ''}`}
            type="button"
            onClick={() => chooseSource('url')}
          >
            <LinkIcon size={22} />
            <strong>Recipe URL</strong>
            <span>Import from a web page with recipe metadata or visible recipe text.</span>
          </button>
          <button
            className={`option-card ${sourceType === 'photos' ? 'selected' : ''}`}
            type="button"
            onClick={() => chooseSource('photos')}
          >
            <UploadCloud size={22} />
            <strong>Recipe photos</strong>
            <span>Upload up to five photos — printed or handwritten — and extract the recipe with AI assistance.</span>
          </button>
        </div>

        {sourceType === 'url' && (
          <Field label="Recipe URL">
            <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/recipe" />
          </Field>
        )}

        {sourceType === 'url' && (
          <div className="option-grid">
            <button
              className={`option-card ${mode === 'verbatim' ? 'selected' : ''}`}
              type="button"
              onClick={() => {
                setMode('verbatim');
                setCreateToddlerVersion(false);
              }}
            >
              <LinkIcon size={22} />
              <strong>Verbatim import</strong>
              <span>Extract and save the page recipe as-is where possible.</span>
            </button>
            <button
              className={`option-card ${mode === 'ai' ? 'selected' : ''}`}
              type="button"
              onClick={() => setMode('ai')}
            >
              <KeyRound size={22} />
              <strong>ChatGPT processed import</strong>
              <span>Normalize structure, remove story content, and convert units to metric.</span>
            </button>
          </div>
        )}

        {sourceType === 'photos' && (
          <div className="photo-import-panel">
            <label className={`photo-drop ${photos.length >= MAX_IMPORT_PHOTOS ? 'disabled' : ''}`}>
              <UploadCloud size={24} />
              <strong>Upload recipe photos (printed or handwritten)</strong>
              <span>
                PNG, JPEG, or WebP. Up to {MAX_IMPORT_PHOTOS} photos, {fileSizeLabel(MAX_IMPORT_PHOTO_BYTES)} each.
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                disabled={photos.length >= MAX_IMPORT_PHOTOS}
                onChange={handlePhotoUpload}
              />
            </label>

            {photos.length > 0 && (
              <div className="photo-list">
                {photos.map((photo, index) => (
                  <div className="photo-item" key={`${photo.name}-${index}`}>
                    <img src={photo.dataUrl} alt="" />
                    <div>
                      <strong>{photo.name || `Recipe photo ${index + 1}`}</strong>
                      <span>{fileSizeLabel(photo.size)}</span>
                    </div>
                    <button className="icon-button" type="button" title="Remove photo" onClick={() => removePhoto(index)}>
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {mode === 'ai' && (
          <>
            <MultiSelectDropdown
              label={t('recipeTranslations')}
              options={languageOptions(preferences).map((option) => ({
                value: option.code,
                label: option.label
              }))}
              selectedValues={translationLanguages}
              onChange={setTranslationLanguages}
              placeholder="Original language only"
              emptyText="No translation languages configured"
            />
            <label className="toggle-row toddler-toggle">
              <input
                type="checkbox"
                checked={createToddlerVersion}
                onChange={(event) => setCreateToddlerVersion(event.target.checked)}
              />
              <span>Create toddler helper version with AI step images</span>
            </label>
          </>
        )}

        {error && <div className="state error">{error}</div>}
        {warnings.map((warning) => (
          <div className="state" key={warning}>
            {warning}
          </div>
        ))}

        <button
          className="primary-button wide"
          type="submit"
          disabled={loading || (sourceType === 'url' ? !url.trim() : !photos.length)}
        >
          {loading ? <Loader2 className="spin" size={18} /> : sourceType === 'photos' ? <UploadCloud size={18} /> : <LinkIcon size={18} />}
          Import recipe
        </button>
      </form>
    </section>
  );
}

function TagsSearchPage() {
  const { preferences, language, t } = useI18n();
  const [tags, setTags] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([api.listTags(), api.listRecipes({ search, tags: selectedTags, categories: selectedCategories })])
      .then(([tagPayload, recipePayload]) => {
        if (!active) return;
        setTags(tagPayload.tags);
        setRecipes(recipePayload.recipes);
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [search, selectedTags, selectedCategories]);

  return (
    <section className="view">
      <div className="view-header">
        <div>
          <p className="eyebrow">{t('tagsSearch')}</p>
          <h1>Find recipes fast</h1>
        </div>
      </div>

      <div className="toolbar search-filter-toolbar">
        <label className="search-box">
          <Search size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('searchPlaceholder')} />
        </label>
        <MultiSelectDropdown
          label={t('categories')}
          options={(preferences.categoryFilters || []).map((category) => ({
            value: category,
            label: translateCategoryName(category, language)
          }))}
          selectedValues={selectedCategories}
          onChange={setSelectedCategories}
          placeholder={t('allCategories')}
          emptyText="No categories configured"
        />
        <MultiSelectDropdown
          label={t('tags')}
          options={tags
            .filter((tag) => !tag.isCategory)
            .map((tag) => ({ value: tag.slug, label: tag.name, count: tag.recipeCount }))}
          selectedValues={selectedTags}
          onChange={setSelectedTags}
          placeholder={t('allTags')}
          emptyText="No tags available"
        />
      </div>

      <StatusMessage
        loading={loading}
        error={error}
        empty={!recipes.length}
        emptyText="No matching recipes"
        emptyChecklist={['Adjust the search text', 'Remove one or more tag filters', 'Add tags to imported recipes']}
      />
      <div className="recipe-grid">
        {recipes.map((recipe) => (
          <RecipeCard recipe={recipe} key={recipe.id} />
        ))}
      </div>
    </section>
  );
}

function SettingsPage() {
  const { setPreferences, t } = useI18n();
  const tabs = [
    { id: 'general', label: t('general'), icon: Settings },
    { id: 'llm', label: t('llm'), icon: Bot },
    { id: 'backup', label: t('backup'), icon: DatabaseBackup }
  ];
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState(null);
  const [appVersion, setAppVersion] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [clearKey, setClearKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [importingBackup, setImportingBackup] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([api.getSettings(), api.getVersion()])
      .then(([settingsPayload, versionPayload]) => {
        setSettings(settingsPayload.settings);
        setAppVersion(versionPayload);
      })
      .catch((err) => setError(err.message));
  }, []);

  function updateField(field, value) {
    setSettings((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const body = {
        defaultLanguage: settings.defaultLanguage,
        unitSystem: 'metric',
        aiProcessingEnabled: settings.aiProcessingEnabled,
        llmProvider: settings.llmProvider,
        openaiModel: settings.openaiModel,
        categoryFilters: settings.categoryFilters
      };
      if (apiKey.trim()) body.openaiApiKey = apiKey.trim();
      if (clearKey) body.openaiApiKey = '';
      const payload = await api.updateSettings(body);
      setSettings(payload.settings);
      setPreferences((current) => ({
        ...current,
        defaultLanguage: payload.settings.defaultLanguage,
        supportedLanguages: payload.settings.supportedLanguages,
        categoryFilters: payload.settings.categoryFilters
      }));
      setApiKey('');
      setClearKey(false);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function verifyKey() {
    setVerifying(true);
    setError('');
    try {
      const payload = await api.verifyOpenAi({
        apiKey: apiKey.trim() || undefined,
        model: settings.openaiModel
      });
      setSettings(payload.settings);
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  }

  async function exportBackup() {
    setError('');
    const backup = await api.exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tl-recipe-core-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function importBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportingBackup(true);
    setError('');
    try {
      const text = await file.text();
      const payload = await api.importBackup(JSON.parse(text));
      setSaved(`Imported ${payload.importedCount} recipes`);
    } catch (err) {
      setError(err.message);
    } finally {
      setImportingBackup(false);
      event.target.value = '';
    }
  }

  function addCategoryFilter() {
    const cleaned = newCategory.trim();
    if (!cleaned) return;
    updateField('categoryFilters', [...(settings.categoryFilters || []), cleaned]);
    setNewCategory('');
  }

  function removeCategoryFilter(category) {
    updateField(
      'categoryFilters',
      (settings.categoryFilters || []).filter((item) => item !== category)
    );
  }

  if (!settings && !error) {
    return (
      <section className="view">
        <StatusMessage loading />
      </section>
    );
  }

  const usage = settings?.usageSummary || {
    recipeCount: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    averageResponseMs: 0,
    byModel: []
  };

  return (
    <section className="view">
      <div className="view-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>{t('userSettings')}</h1>
        </div>
      </div>

      {error && <div className="state error">{error}</div>}
      {settings && (
        <form onSubmit={submit}>
          <div className="tab-list" role="tablist" aria-label="Settings sections">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={17} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="surface settings-surface">
            {activeTab === 'general' && (
              <div className="form-grid">
                <Field label={t('defaultLanguage')}>
                  <select
                    value={settings.defaultLanguage}
                    onChange={(event) => updateField('defaultLanguage', event.target.value)}
                  >
                    {(settings.supportedLanguages || []).map((language) => (
                      <option value={language.code} key={language.code}>
                        {language.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t('defaultUnitSystem')}>
                  <select value="metric" disabled>
                    <option value="metric">Metric</option>
                  </select>
                </Field>
                <label className="toggle-row">
                  <input
                    type="checkbox"
                    checked={settings.aiProcessingEnabled}
                    onChange={(event) => updateField('aiProcessingEnabled', event.target.checked)}
                  />
                  <span>Enable AI processing</span>
                </label>
                <div className="field">
                  <span>Running version</span>
                  <div className="setting-status">
                    <Settings size={17} />
                    {appVersion ? `${appVersion.name} ${appVersion.version}` : 'Loading'}
                  </div>
                </div>
                <div className="field category-settings">
                  <span>{t('categoryFilters')}</span>
                  <div className="selected-tag-list">
                    {(settings.categoryFilters || []).map((category) => (
                      <button
                        className="tag-remove-chip"
                        type="button"
                        key={category}
                        onClick={() => removeCategoryFilter(category)}
                      >
                        <span>{category}</span>
                        <X size={14} />
                      </button>
                    ))}
                  </div>
                  <div className="inline-form">
                    <input
                      value={newCategory}
                      onChange={(event) => setNewCategory(event.target.value)}
                      placeholder={t('addCategory')}
                    />
                    <button className="secondary-button" type="button" onClick={addCategoryFilter}>
                      <Plus size={18} />
                      {t('add')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'llm' && (
              <div className="stack">
                <div className="option-grid three">
                  <button className="option-card disabled" type="button" disabled>
                    <ServerCog size={22} />
                    <strong>Platform supplied ChatGPT</strong>
                    <span>Disabled</span>
                  </button>
                  <button
                    className={`option-card ${settings.llmProvider === 'own_chatgpt' ? 'selected' : ''}`}
                    type="button"
                    onClick={() => updateField('llmProvider', 'own_chatgpt')}
                  >
                    <KeyRound size={22} />
                    <strong>Own ChatGPT</strong>
                    <span>{settings.openaiApiKeyConfigured ? 'Configured' : 'Needs API key'}</span>
                  </button>
                  <button className="option-card disabled" type="button" disabled>
                    <Layers size={22} />
                    <strong>Bring your own LLM</strong>
                    <span>Disabled</span>
                  </button>
                </div>

                <div className="form-grid">
                  <Field label="OpenAI API key">
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(event) => setApiKey(event.target.value)}
                      placeholder={settings.openaiApiKeyConfigured ? 'Configured' : 'Not configured'}
                      disabled={settings.openaiApiKeySource === 'environment'}
                    />
                  </Field>
                  <Field label="Model">
                    <select
                      value={settings.openaiModel}
                      onChange={(event) => updateField('openaiModel', event.target.value)}
                    >
                      {settings.openaiModelOptions.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.label} - {model.tier}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div className="field">
                    <span>API key status</span>
                    <div className={`setting-status ${settings.openaiKeyStatus}`}>
                      <KeyRound size={17} />
                      {settings.openaiKeyStatus}
                      {settings.openaiKeyCheckedAt && (
                        <small>{new Date(settings.openaiKeyCheckedAt).toLocaleString()}</small>
                      )}
                    </div>
                  </div>
                  <div className="field">
                    <span>Model usage</span>
                    <div className="setting-status">
                      <Gauge size={17} />
                      {numberLabel(usage.recipeCount)} AI imports
                    </div>
                  </div>
                </div>

                {settings.openaiKeyError && <div className="state error">{settings.openaiKeyError}</div>}

                <div className="metric-grid">
                  <div>
                    <span>Input tokens</span>
                    <strong>{numberLabel(usage.inputTokens)}</strong>
                  </div>
                  <div>
                    <span>Output tokens</span>
                    <strong>{numberLabel(usage.outputTokens)}</strong>
                  </div>
                  <div>
                    <span>Total tokens</span>
                    <strong>{numberLabel(usage.totalTokens)}</strong>
                  </div>
                  <div>
                    <span>Total cost</span>
                    <strong>{moneyLabel(usage.totalCostUsd)}</strong>
                  </div>
                  <div>
                    <span>Avg response</span>
                    <strong>{numberLabel(usage.averageResponseMs)} ms</strong>
                  </div>
                </div>

                <div className="usage-table">
                  <div className="usage-table-header">
                    <span>Model</span>
                    <span>Imports</span>
                    <span>Tokens</span>
                    <span>Cost</span>
                    <span>Avg</span>
                  </div>
                  {usage.byModel.length ? (
                    usage.byModel.map((row) => (
                      <div className="usage-table-row" key={row.model}>
                        <span>{row.model}</span>
                        <span>{numberLabel(row.recipeCount)}</span>
                        <span>{numberLabel(row.totalTokens)}</span>
                        <span>{moneyLabel(row.totalCostUsd)}</span>
                        <span>{numberLabel(row.averageResponseMs)} ms</span>
                      </div>
                    ))
                  ) : (
                    <div className="usage-table-empty">No AI imports yet.</div>
                  )}
                </div>

                <label className="toggle-row">
                  <input
                    type="checkbox"
                    checked={clearKey}
                    disabled={settings.openaiApiKeySource === 'environment'}
                    onChange={(event) => setClearKey(event.target.checked)}
                  />
                  <span>Clear stored OpenAI key</span>
                </label>

                <div className="form-actions split-actions">
                  <button className="secondary-button" type="button" onClick={verifyKey} disabled={verifying}>
                    {verifying ? <Loader2 className="spin" size={18} /> : <KeyRound size={18} />}
                    Verify key
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'backup' && (
              <div className="stack">
                <div className="option-grid">
                  <button className="option-card" type="button" onClick={exportBackup}>
                    <Download size={22} />
                    <strong>Export data</strong>
                    <span>Download recipes and tags as JSON.</span>
                  </button>
                  <label className="option-card file-option">
                    <UploadCloud size={22} />
                    <strong>Import data</strong>
                    <span>{importingBackup ? 'Importing' : 'Upload a TL Recipe Core backup file.'}</span>
                    <input type="file" accept="application/json" onChange={importBackup} disabled={importingBackup} />
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            {saved && <span className="saved">{saved === true ? t('saved') : saved}</span>}
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
              {t('saveSettings')}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function SaasManagementPage() {
  return (
    <section className="view">
      <div className="view-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>SaaS Management</h1>
        </div>
      </div>

      <div className="admin-grid">
        <section className="surface admin-panel">
          <ServerCog size={24} />
          <h2>Platform LLM</h2>
          <div className="setting-status">Disabled</div>
        </section>
        <section className="surface admin-panel">
          <Gauge size={24} />
          <h2>Usage Metrics</h2>
          <label className="toggle-row">
            <input type="checkbox" checked readOnly disabled />
            <span>Collect import metrics</span>
          </label>
        </section>
        <section className="surface admin-panel">
          <ShieldCheck size={24} />
          <h2>Admin Access</h2>
          <div className="setting-status">Local admin placeholder</div>
        </section>
      </div>
    </section>
  );
}

function SharedRecipePage({ token }) {
  const { preferences, t } = useI18n();
  const [recipe, setRecipe] = useState(null);
  const [language, setLanguage] = useState('original');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .getSharedRecipe(token)
      .then((payload) => active && setRecipe(payload.recipe))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [token]);

  if (loading || error || !recipe) {
    return (
      <div className="shared-page">
        <div className="shared-card">
          <StatusMessage loading={loading} error={error} empty={!recipe && !loading && !error} emptyText={t('sharedRecipeMissing')} />
        </div>
      </div>
    );
  }

  const shownRecipe = displayRecipe(recipe, language);
  const shownTags = translatedTags(recipe, language);
  const availableLanguages = languageOptions(preferences).filter((option) => recipe.translations?.[option.code]);

  return (
    <div className="shared-page">
      <div className="shared-card">
        <div className="shared-toolbar no-print">
          <span className="brand-mark">TL</span>
          <div className="shared-toolbar-actions">
            {availableLanguages.length > 0 && (
              <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                <option value="original">{t('originalRecipe')}</option>
                {availableLanguages.map((option) => (
                  <option value={option.code} key={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            <button className="primary-button" type="button" onClick={() => window.print()}>
              <Printer size={18} />
              {t('saveAsPdf')}
            </button>
          </div>
        </div>

        {recipe.imageUrl && (
          <div className="shared-image">
            <img src={recipe.imageUrl} alt="" />
          </div>
        )}

        <p className="eyebrow">{t('sharedRecipe')}</p>
        <h1>{shownRecipe.title}</h1>
        {shownRecipe.shortDescription && <p className="shared-lede">{shownRecipe.shortDescription}</p>}
        <TimeMeta recipe={recipe} />
        {shownTags.length > 0 && (
          <div className="tag-row">
            {shownTags.map((tag) => (
              <span className="tag-chip" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="shared-grid">
          <section className="content-block">
            <h2>{t('ingredients')}</h2>
            <ul className="ingredient-list">
              {shownRecipe.ingredients.map((ingredient, index) => (
                <li key={`${ingredient.name}-${index}`}>
                  <strong>
                    {[ingredient.quantity, ingredient.unit].filter(Boolean).join(' ')}
                    {ingredient.quantity || ingredient.unit ? ' ' : ''}
                    {ingredient.name}
                  </strong>
                  {ingredient.notes && <span>{ingredient.notes}</span>}
                </li>
              ))}
            </ul>
          </section>

          <section className="content-block">
            <h2>{t('method')}</h2>
            <ol className="step-list">
              {shownRecipe.steps.map((step, index) => (
                <li className={step.imageUrl ? 'illustrated-step' : ''} key={`${step.text}-${index}`}>
                  {step.imageUrl && <img src={step.imageUrl} alt="" />}
                  <span>{step.text}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <footer className="shared-footer">
          <span className="brand-mark">TL</span>
          <span>TL Recipe Core</span>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  const route = useRoute();
  // Keep the screen awake while the app is open so it stays readable while cooking,
  // in a normal browser tab as well as an installed webapp (issue #10). The Wake
  // Lock request fails silently where the browser or battery saver disallows it.
  useKeepAwake(true);
  const initialAuthHeader = useRef(getStoredAuthHeader());
  const authHeaderRef = useRef(initialAuthHeader.current);
  const authWaitersRef = useRef([]);
  const [authHeader, setAuthHeader] = useState(initialAuthHeader.current);
  const [authChallenge, setAuthChallenge] = useState(null);
  const [preferences, setPreferences] = useState({
    defaultLanguage: 'en',
    supportedLanguages: FALLBACK_LANGUAGE_OPTIONS,
    categoryFilters: []
  });
  const shareMatch = route.match(/^\/share\/(.+)$/);
  const editMatch = shareMatch ? null : route.match(/^\/recipes\/(.+)\/edit$/);
  const recipeMatch = shareMatch || editMatch ? null : route.match(/^\/recipes\/(.+)$/);

  useLayoutEffect(() => {
    configureAuth({
      getAuthorizationHeader: async ({ force = false } = {}) => {
        if (!force && authHeaderRef.current) return authHeaderRef.current;
        return new Promise((resolve) => {
          authWaitersRef.current.push(resolve);
          setAuthChallenge({ invalid: force, requestedAt: Date.now() });
        });
      },
      onUnauthorized: () => {
        authHeaderRef.current = '';
        setAuthHeader('');
        storeAuthHeader('');
      }
    });
  }, []);

  useEffect(() => {
    let active = true;
    api
      .getPreferences()
      .then((payload) => {
        if (active) setPreferences(payload.preferences);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const i18nValue = useMemo(() => {
    const language = preferences.defaultLanguage || 'en';
    return {
      language,
      preferences,
      setPreferences,
      t: (key) => MESSAGES[language]?.[key] || EN_MESSAGES[key] || key
    };
  }, [preferences]);

  function completeManagementLogin(email, password) {
    const header = encodeBasicAuth(email, password);
    authHeaderRef.current = header;
    setAuthHeader(header);
    storeAuthHeader(header);
    setAuthChallenge(null);
    authWaitersRef.current.splice(0).forEach((resolve) => resolve(header));
  }

  function cancelManagementLogin() {
    setAuthChallenge(null);
    authWaitersRef.current.splice(0).forEach((resolve) => resolve(null));
  }

  function signOutManagement() {
    authHeaderRef.current = '';
    setAuthHeader('');
    storeAuthHeader('');
  }

  if (shareMatch) {
    return (
      <I18nContext.Provider value={i18nValue}>
        <SharedRecipePage token={decodeURIComponent(shareMatch[1])} />
      </I18nContext.Provider>
    );
  }

  let page;
  if (editMatch) page = <AddRecipePage recipeId={editMatch[1]} />;
  else if (recipeMatch) page = <RecipeDetailPage id={recipeMatch[1]} />;
  else if (route === '/add') page = <AddRecipePage />;
  else if (route === '/import') page = <ImportPage />;
  else if (route === '/tags') page = <TagsSearchPage />;
  else if (route === '/settings') page = <SettingsPage />;
  else if (route === '/saas' && isAdminUser) page = <SaasManagementPage />;
  else page = <RecipesPage />;

  return (
    <I18nContext.Provider value={i18nValue}>
      <div className="app-shell">
        <AppNav
          route={route}
          managementUnlocked={Boolean(authHeader)}
          onManagementSignOut={signOutManagement}
        />
        <main className="main-content">{page}</main>
        <ManagementLoginDialog
          challenge={authChallenge}
          onSubmit={completeManagementLogin}
          onCancel={cancelManagementLogin}
        />
      </div>
    </I18nContext.Provider>
  );
}
