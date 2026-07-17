import { listRecipes, createRecipe } from './recipeStore.js';
import { backupImportSchema } from '../validation.js';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

const appVersion = JSON.parse(
  readFileSync(path.join(config.rootDir, 'shared', 'app-version.json'), 'utf8')
);

function recipeToBackup(recipe) {
  return {
    title: recipe.title,
    shortDescription: recipe.shortDescription,
    imageUrl: recipe.imageUrl,
    activeTimeMinutes: recipe.activeTimeMinutes,
    totalTimeMinutes: recipe.totalTimeMinutes,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    translations: recipe.translations || {},
    tags: (recipe.tags || []).map((tag) => tag.name),
    sourceUrl: recipe.sourceUrl,
    videoUrl: recipe.videoUrl || '',
    sourcePhotos: recipe.sourcePhotos || [],
    sourceSnapshot: recipe.sourceSnapshot || '',
    importMode: recipe.importMode
  };
}

export async function exportPersonalBackup() {
  const recipes = await listRecipes();
  return {
    app: appVersion.name,
    version: appVersion.version,
    exportedAt: new Date().toISOString(),
    recipes: recipes.map(recipeToBackup)
  };
}

export async function importPersonalBackup(payload) {
  const input = backupImportSchema.parse(payload);
  const created = [];

  for (const recipe of input.recipes) {
    created.push(await createRecipe(recipe));
  }

  return {
    importedCount: created.length,
    recipes: created
  };
}
