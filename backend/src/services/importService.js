import * as cheerio from 'cheerio';
import { badRequest } from '../errors.js';
import { createRecipe } from './recipeStore.js';
import {
  createToddlerRecipeWithOpenAi,
  normalizeRecipeFromPhotosWithOpenAi,
  normalizeRecipeWithOpenAi
} from './aiService.js';
import { parseDurationToMinutes } from '../utils/duration.js';
import { uniqueStrings } from '../utils/slug.js';
import { recipeInputSchema } from '../validation.js';
import { assertRecipeContentSafety } from '../utils/contentSafety.js';

const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function findRecipeNode(node) {
  if (!node || typeof node !== 'object') return null;

  const type = node['@type'];
  const types = Array.isArray(type) ? type : [type];
  if (types.some((item) => String(item).toLowerCase() === 'recipe')) return node;

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = findRecipeNode(item);
        if (found) return found;
      }
    } else if (value && typeof value === 'object') {
      const found = findRecipeNode(value);
      if (found) return found;
    }
  }

  return null;
}

function imageFromJsonLd(value) {
  const image = asArray(value)[0];
  if (!image) return '';
  if (typeof image === 'string') return image;
  return image.url || image.contentUrl || '';
}

const YOUTUBE_HOSTS = ['youtube.com', 'youtube-nocookie.com'];

// Normalize a YouTube URL (watch, youtu.be, or /embed/ form) to a canonical
// https://www.youtube.com/watch?v=<id> link. Returns '' when not a YouTube URL.
function normalizeYouTubeUrl(rawUrl) {
  const value = cleanText(rawUrl);
  if (!value) return '';
  let parsed;
  try {
    parsed = new URL(value, 'https://www.youtube.com');
  } catch {
    return '';
  }
  const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
  // Match the host exactly or as a subdomain. A bare endsWith() would also
  // accept lookalikes such as evilyoutube.com.
  const isYouTubeHost = YOUTUBE_HOSTS.some((known) => host === known || host.endsWith(`.${known}`));
  let id = '';
  if (host === 'youtu.be') {
    id = parsed.pathname.split('/').filter(Boolean)[0] || '';
  } else if (isYouTubeHost) {
    if (parsed.pathname === '/watch') id = parsed.searchParams.get('v') || '';
    else if (parsed.pathname.startsWith('/embed/') || parsed.pathname.startsWith('/shorts/')) {
      id = parsed.pathname.split('/').filter(Boolean)[1] || '';
    }
  }
  if (!/^[a-zA-Z0-9_-]{6,20}$/.test(id)) return '';
  return `https://www.youtube.com/watch?v=${id}`;
}

// Pull the recipe's own video from a JSON-LD recipe node's `video` property
// (a VideoObject or array of them). Prefer a YouTube link; otherwise take the
// first direct content URL. Unrelated page videos live outside this node.
function videoFromJsonLd(value) {
  const videos = asArray(value);
  let firstUrl = '';
  for (const video of videos) {
    const candidates =
      typeof video === 'string'
        ? [video]
        : [video?.contentUrl, video?.embedUrl, video?.url].filter(Boolean);
    for (const candidate of candidates) {
      const youtube = normalizeYouTubeUrl(candidate);
      if (youtube) return youtube;
      if (!firstUrl && isHttpUrl(candidate)) firstUrl = cleanText(candidate);
    }
  }
  return firstUrl;
}

function isHttpUrl(value) {
  try {
    const parsed = new URL(cleanText(value));
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// DOM fallback for the recipe video when JSON-LD carries none: an in-content
// YouTube embed or the page's og:video. Selectors are ordered so an embed
// inside <article>/<main> always wins over one elsewhere on the page; the
// document-wide selectors only apply to pages that use neither landmark.
function extractVideoUrlFromDom($) {
  const embedSelectors = [
    'article iframe[src*="youtube.com/embed/"]',
    'article iframe[src*="youtube-nocookie.com/embed/"]',
    'main iframe[src*="youtube.com/embed/"]',
    'main iframe[src*="youtube-nocookie.com/embed/"]',
    // Last resort: plenty of recipe sites wrap their content in neither
    // <article> nor <main>. Ordering still prefers an in-content embed, and
    // normalizeYouTubeUrl() is what actually validates the host.
    'iframe[src*="youtube.com/embed/"]',
    'iframe[src*="youtube-nocookie.com/embed/"]'
  ];
  for (const selector of embedSelectors) {
    const src = $(selector).first().attr('src');
    const youtube = normalizeYouTubeUrl(src);
    if (youtube) return youtube;
  }

  const ogVideo =
    $('meta[property="og:video:url"]').attr('content') ||
    $('meta[property="og:video"]').attr('content') ||
    $('meta[property="og:video:secure_url"]').attr('content');
  const ogYouTube = normalizeYouTubeUrl(ogVideo);
  if (ogYouTube) return ogYouTube;
  if (isHttpUrl(ogVideo)) return cleanText(ogVideo);

  return '';
}

function instructionsFromJsonLd(value) {
  return asArray(value)
    .flatMap((item) => {
      if (typeof item === 'string') return [item];
      if (item?.['@type'] === 'HowToSection') return instructionsFromJsonLd(item.itemListElement);
      return [item?.text || item?.name || ''];
    })
    .map(cleanText)
    .filter(Boolean)
    .map((text) => ({ text }));
}

function tagsFromJsonLd(recipe) {
  return uniqueStrings([
    ...asArray(recipe.recipeCategory),
    ...asArray(recipe.recipeCuisine),
    ...String(recipe.keywords || '')
      .split(',')
      .map((keyword) => keyword.trim())
  ]);
}

function ingredientFromLine(line) {
  return {
    name: cleanText(line),
    quantity: '',
    unit: '',
    notes: ''
  };
}

function extractJsonLdRecipe($) {
  const scripts = $('script[type="application/ld+json"]')
    .map((_, element) => $(element).contents().text())
    .get();

  for (const script of scripts) {
    const parsed = safeJsonParse(script);
    const recipe = findRecipeNode(parsed);
    if (!recipe) continue;

    return {
      title: cleanText(recipe.name),
      shortDescription: cleanText(recipe.description),
      imageUrl: imageFromJsonLd(recipe.image),
      videoUrl: videoFromJsonLd(recipe.video),
      activeTimeMinutes:
        parseDurationToMinutes(recipe.prepTime) ?? parseDurationToMinutes(recipe.cookTime),
      totalTimeMinutes: parseDurationToMinutes(recipe.totalTime),
      ingredients: asArray(recipe.recipeIngredient).map(ingredientFromLine).filter((item) => item.name),
      steps: instructionsFromJsonLd(recipe.recipeInstructions),
      tags: tagsFromJsonLd(recipe)
    };
  }

  return null;
}

function extractFallbackRecipe($, url) {
  const title =
    cleanText($('meta[property="og:title"]').attr('content')) ||
    cleanText($('h1').first().text()) ||
    cleanText($('title').text()) ||
    new URL(url).hostname;
  const shortDescription =
    cleanText($('meta[property="og:description"]').attr('content')) ||
    cleanText($('meta[name="description"]').attr('content'));
  const imageUrl =
    cleanText($('meta[property="og:image"]').attr('content')) ||
    cleanText($('meta[name="twitter:image"]').attr('content'));

  const listIngredients = $('[itemprop="recipeIngredient"], .ingredients li, [class*="ingredient"] li')
    .map((_, element) => cleanText($(element).text()))
    .get()
    .filter(Boolean)
    .slice(0, 80);
  const listSteps = $('[itemprop="recipeInstructions"], .instructions li, .method li, [class*="instruction"] li')
    .map((_, element) => cleanText($(element).text()))
    .get()
    .filter(Boolean)
    .slice(0, 80);

  return {
    title,
    shortDescription,
    imageUrl,
    activeTimeMinutes: null,
    totalTimeMinutes: null,
    ingredients: listIngredients.map(ingredientFromLine),
    steps: listSteps.map((text) => ({ text })),
    tags: []
  };
}

export function extractRecipeFromHtml(html, url) {
  const $ = cheerio.load(html);
  const extracted = extractJsonLdRecipe($) || extractFallbackRecipe($, url);
  const videoUrl = cleanText(extracted?.videoUrl) || extractVideoUrlFromDom($);

  $('script, style, noscript, svg').remove();
  const sourceText = cleanText(($('article').text() || $('main').text() || $('body').text()).slice(0, 60000));

  return { extracted, sourceText, videoUrl };
}

export function buildVerbatimRecipe({ extracted, sourceText, sourceUrl, videoUrl = '' }) {
  const recipe = {
    title: extracted.title || new URL(sourceUrl).hostname,
    shortDescription:
      extracted.shortDescription ||
      `Imported from ${new URL(sourceUrl).hostname}. Review the source for full context.`,
    imageUrl: extracted.imageUrl || '',
    activeTimeMinutes: extracted.activeTimeMinutes ?? null,
    totalTimeMinutes: extracted.totalTimeMinutes ?? null,
    ingredients:
      extracted.ingredients?.length > 0
        ? extracted.ingredients
        : [{ name: 'Review source recipe', quantity: '', unit: '', notes: sourceText.slice(0, 500) }],
    steps:
      extracted.steps?.length > 0
        ? extracted.steps
        : [{ text: sourceText.slice(0, 1000) || 'Review the original source for the method.' }],
    tags: uniqueStrings([...(extracted.tags || []), 'imported']),
    sourceUrl,
    videoUrl: videoUrl || '',
    sourceSnapshot: sourceText || '',
    importMode: 'verbatim'
  };

  // Verbatim imports never pass through the AI screen, so guard them here.
  assertRecipeContentSafety(recipe);
  return recipeInputSchema.parse(recipe);
}

export async function fetchRecipePage(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'TL Recipe Core/0.1 recipe importer'
    },
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    throw badRequest(`Could not fetch recipe URL (${response.status})`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
    throw badRequest('The URL did not return an HTML recipe page');
  }

  return response.text();
}

function normalizePhotoUpload(photo, index) {
  const match = String(photo.dataUrl || '').match(/^data:image\/(jpeg|jpg|png|webp);base64,([a-z0-9+/=\s]+)$/i);
  if (!match) {
    throw badRequest(`Photo ${index + 1} must be a PNG, JPEG, or WebP image`);
  }

  const type = match[1].toLowerCase() === 'jpg' ? 'jpeg' : match[1].toLowerCase();
  const base64 = match[2].replace(/\s+/g, '');
  const sizeBytes = Buffer.byteLength(base64, 'base64');
  if (sizeBytes > MAX_PHOTO_BYTES) {
    throw badRequest(`Photo ${index + 1} is too large. Upload photos up to 4 MB each.`);
  }

  return {
    name: cleanText(photo.name) || `Recipe photo ${index + 1}`,
    type: `image/${type}`,
    sizeBytes,
    dataUrl: `data:image/${type};base64,${base64}`
  };
}

export async function importRecipeFromUrl({ url, mode, createToddlerVersion = false, translationLanguages = [] }) {
  const html = await fetchRecipePage(url);
  const { extracted, sourceText, videoUrl } = extractRecipeFromHtml(html, url);
  if (createToddlerVersion && mode !== 'ai') {
    throw badRequest('Toddler helper recipes are only available for AI-assisted imports');
  }

  const input =
    mode === 'ai'
      ? await normalizeRecipeWithOpenAi({ sourceUrl: url, extracted, sourceText, translationLanguages }).then((result) => ({
          ...result.recipe,
          // The video link and source archive are extracted deterministically from
          // the page (issues #8, #11), not produced by the model.
          videoUrl: result.recipe.videoUrl || videoUrl || '',
          sourceSnapshot: sourceText || '',
          llmUsage: result.llmUsage
        }))
      : buildVerbatimRecipe({ extracted, sourceText, sourceUrl: url, videoUrl });

  const recipe = await createRecipe(input);
  let toddlerRecipe = null;
  const toddlerWarnings = [];

  if (mode === 'ai' && createToddlerVersion) {
    try {
      const toddlerResult = await createToddlerRecipeWithOpenAi({ sourceRecipe: recipe, sourceUrl: url });
      toddlerRecipe = await createRecipe(toddlerResult.recipe);
      toddlerWarnings.push(...toddlerResult.warnings);
    } catch (error) {
      toddlerWarnings.push(`Toddler helper recipe was not created: ${error.message}`);
    }
  }

  return {
    recipe,
    toddlerRecipe,
    importMode: mode,
    warnings: [
      ...(mode === 'verbatim' && (!extracted.ingredients?.length || !extracted.steps?.length)
        ? ['Some fields could not be extracted automatically. The original source URL was preserved.']
        : []),
      ...toddlerWarnings
    ]
  };
}

export async function importRecipeFromPhotos({ photos, createToddlerVersion = false, translationLanguages = [] }) {
  const normalizedPhotos = photos.map(normalizePhotoUpload);
  const result = await normalizeRecipeFromPhotosWithOpenAi({ photos: normalizedPhotos, translationLanguages });
  const recipe = await createRecipe({
    ...result.recipe,
    sourcePhotos: normalizedPhotos.map(({ name, type, dataUrl }) => ({ name, type, dataUrl })),
    llmUsage: result.llmUsage
  });

  let toddlerRecipe = null;
  const toddlerWarnings = [];

  if (createToddlerVersion) {
    try {
      const toddlerResult = await createToddlerRecipeWithOpenAi({ sourceRecipe: recipe, sourceUrl: '' });
      toddlerRecipe = await createRecipe(toddlerResult.recipe);
      toddlerWarnings.push(...toddlerResult.warnings);
    } catch (error) {
      toddlerWarnings.push(`Toddler helper recipe was not created: ${error.message}`);
    }
  }

  return {
    recipe,
    toddlerRecipe,
    importMode: 'ai',
    warnings: toddlerWarnings
  };
}
