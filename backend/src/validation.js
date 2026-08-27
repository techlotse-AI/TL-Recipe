import { z } from 'zod';
import { LLM_PROVIDERS, OPENAI_MODEL_OPTIONS } from './llmOptions.js';
import { SUPPORTED_LANGUAGES, normalizeLanguageCodes } from './categoryOptions.js';

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .default('')
  .refine(
    (value) => !value || value.startsWith('data:image/') || z.string().url().safeParse(value).success,
    'Must be a valid URL or image upload'
  );

export const ingredientSchema = z.object({
  name: z.string().trim().min(1, 'Ingredient name is required'),
  quantity: z.string().trim().optional().default(''),
  unit: z.string().trim().optional().default(''),
  notes: z.string().trim().optional().default(''),
  originalQuantity: z.string().trim().optional().default(''),
  originalUnit: z.string().trim().optional().default(''),
  originalText: z.string().trim().optional().default('')
});

export const stepSchema = z.object({
  text: z.string().trim().min(1, 'Step text is required'),
  imageUrl: optionalUrl,
  imagePrompt: z.string().trim().optional().default('')
});

const translationIngredientSchema = z.object({
  name: z.string().trim().optional().default(''),
  quantity: z.string().trim().optional().default(''),
  unit: z.string().trim().optional().default(''),
  notes: z.string().trim().optional().default(''),
  originalQuantity: z.string().trim().optional().default(''),
  originalUnit: z.string().trim().optional().default(''),
  originalText: z.string().trim().optional().default('')
});

const translationStepSchema = z.object({
  text: z.string().trim().optional().default(''),
  imageUrl: optionalUrl,
  imagePrompt: z.string().trim().optional().default('')
});

const recipeTranslationSchema = z.object({
  title: z.string().trim().optional().default(''),
  shortDescription: z.string().trim().optional().default(''),
  ingredients: z.array(translationIngredientSchema).optional().default([]),
  steps: z.array(translationStepSchema).optional().default([]),
  tags: z.array(z.string().trim().min(1)).optional().default([])
});

const tagInputSchema = z
  .union([
    z.string().trim().min(1),
    z.object({
      name: z.string().trim().min(1)
    })
  ])
  .transform((value) => (typeof value === 'string' ? value : value.name));

const sourcePhotoSchema = z.object({
  name: z.string().trim().max(255).optional().default(''),
  type: z.string().trim().optional().default(''),
  dataUrl: z
    .string()
    .trim()
    .regex(/^data:image\/(jpeg|jpg|png|webp);base64,[a-z0-9+/=\s]+$/i, 'Source photos must be PNG, JPEG, or WebP')
});

export const recipeInputSchema = z.object({
  title: z.string().trim().min(2, 'Title is required'),
  shortDescription: z.string().trim().optional().default(''),
  imageUrl: optionalUrl,
  activeTimeMinutes: z.number().int().nonnegative().nullable().optional(),
  totalTimeMinutes: z.number().int().nonnegative().nullable().optional(),
  ingredients: z.array(ingredientSchema).min(1, 'Add at least one ingredient'),
  steps: z.array(stepSchema).min(1, 'Add at least one method step'),
  tags: z.array(tagInputSchema).max(30).optional().default([]),
  translations: z
    .record(z.string(), recipeTranslationSchema)
    .transform((translations) =>
      Object.fromEntries(
        Object.entries(translations).filter(([language]) => SUPPORTED_LANGUAGES.includes(language))
      )
    )
    .optional()
    .default({}),
  sourceUrl: z.string().trim().url().optional().or(z.literal('')).default(''),
  videoUrl: z.string().trim().url().optional().or(z.literal('')).default(''),
  // Optional on purpose (no default): updates that omit sourcePhotos keep the stored ones.
  sourcePhotos: z.array(sourcePhotoSchema).max(5).optional(),
  // Archived source page text (issue #8). Optional/no default so manual edits that
  // omit it keep the stored snapshot; capped to bound row size.
  sourceSnapshot: z.string().trim().max(200000).optional(),
  importMode: z.enum(['manual', 'verbatim', 'ai']).optional().default('manual'),
  llmUsage: z
    .object({
      provider: z.string().trim().optional().default('own_chatgpt'),
      model: z.string().trim().optional().default(''),
      inputTokens: z.number().int().nonnegative().nullable().optional(),
      outputTokens: z.number().int().nonnegative().nullable().optional(),
      totalTokens: z.number().int().nonnegative().nullable().optional(),
      responseMs: z.number().int().nonnegative().nullable().optional(),
      inputPricePerMillionUsd: z.number().nonnegative().nullable().optional(),
      outputPricePerMillionUsd: z.number().nonnegative().nullable().optional(),
      inputCostUsd: z.number().nonnegative().nullable().optional(),
      outputCostUsd: z.number().nonnegative().nullable().optional(),
      imageModel: z.string().trim().optional().default(''),
      imageCount: z.number().int().nonnegative().nullable().optional(),
      imageCostUsd: z.number().nonnegative().nullable().optional(),
      totalCostUsd: z.number().nonnegative().nullable().optional()
    })
    .nullable()
    .optional()
});

export const importRequestSchema = z.object({
  url: z.string().trim().url('Enter a valid recipe URL'),
  mode: z.enum(['verbatim', 'ai']),
  createToddlerVersion: z.boolean().optional().default(false),
  translationLanguages: z.array(z.enum(SUPPORTED_LANGUAGES)).optional().default([])
    .transform((languages) => normalizeLanguageCodes(languages))
});

const photoDataUrlSchema = z
  .string()
  .trim()
  .regex(/^data:image\/(jpeg|jpg|png|webp);base64,[a-z0-9+/=\s]+$/i, 'Upload PNG, JPEG, or WebP photos');

export const photoImportRequestSchema = z.object({
  photos: z
    .array(
      z.object({
        name: z.string().trim().max(255).optional().default(''),
        type: z.string().trim().optional().default(''),
        dataUrl: photoDataUrlSchema
      })
    )
    .min(1, 'Upload at least one recipe photo')
    .max(5, 'Upload up to 5 photos'),
  createToddlerVersion: z.boolean().optional().default(false),
  translationLanguages: z.array(z.enum(SUPPORTED_LANGUAGES)).optional().default([])
    .transform((languages) => normalizeLanguageCodes(languages))
});

export const recipeTranslationRequestSchema = z.object({
  languages: z.array(z.enum(SUPPORTED_LANGUAGES)).min(1, 'Select at least one language')
    .transform((languages) => normalizeLanguageCodes(languages))
});

export const settingsInputSchema = z.object({
  openaiApiKey: z.string().optional(),
  defaultLanguage: z.enum(SUPPORTED_LANGUAGES).optional(),
  unitSystem: z.literal('metric').optional(),
  aiProcessingEnabled: z.boolean().optional(),
  llmProvider: z.enum(LLM_PROVIDERS).optional(),
  openaiModel: z.enum(OPENAI_MODEL_OPTIONS.map((option) => option.id)).optional(),
  categoryFilters: z.array(z.string().trim().min(1).max(60)).max(30).optional()
});

export const verifyOpenAiInputSchema = z.object({
  apiKey: z.string().optional(),
  model: z.enum(OPENAI_MODEL_OPTIONS.map((option) => option.id)).optional()
});

// Allowed share-link lifetimes in hours. null/absent => no expiry (default).
export const SHARE_EXPIRY_HOURS = [1, 24, 168, 720];

export const shareRequestSchema = z.object({
  expiresInHours: z
    .union([z.literal(null), z.number().int().positive()])
    .optional()
    .transform((value) => (value === undefined ? null : value))
    .refine(
      (value) => value === null || SHARE_EXPIRY_HOURS.includes(value),
      'Unsupported share expiry'
    )
});

export const backupImportSchema = z.object({
  version: z.string().optional(),
  recipes: z.array(recipeInputSchema).min(1, 'Backup contains no recipes')
});
