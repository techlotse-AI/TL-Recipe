import test from 'node:test';
import assert from 'node:assert/strict';
import { extractRecipeFromHtml, buildVerbatimRecipe } from '../src/services/importService.js';

const URL = 'https://example.com/recipe';

function jsonLdPage(recipeNode) {
  return `<!doctype html><html><head>
    <script type="application/ld+json">${JSON.stringify(recipeNode)}</script>
    </head><body><article><h1>${recipeNode.name}</h1></article></body></html>`;
}

test('extracts a canonical YouTube URL from JSON-LD recipe video', () => {
  const html = jsonLdPage({
    '@type': 'Recipe',
    name: 'Pancakes',
    recipeIngredient: ['200 g flour'],
    recipeInstructions: ['Mix', 'Cook'],
    video: { '@type': 'VideoObject', embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }
  });
  const { videoUrl } = extractRecipeFromHtml(html, URL);
  assert.equal(videoUrl, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
});

test('falls back to an in-content YouTube embed when JSON-LD has no video', () => {
  const html = `<!doctype html><html><body><article>
    <h1>Soup</h1>
    <iframe src="https://www.youtube.com/embed/abcdefghijk"></iframe>
  </article></body></html>`;
  const { videoUrl } = extractRecipeFromHtml(html, URL);
  assert.equal(videoUrl, 'https://www.youtube.com/watch?v=abcdefghijk');
});

test('leaves videoUrl blank when the page has no recipe video', () => {
  const html = jsonLdPage({
    '@type': 'Recipe',
    name: 'Salad',
    recipeIngredient: ['1 lettuce'],
    recipeInstructions: ['Toss']
  });
  const { videoUrl } = extractRecipeFromHtml(html, URL);
  assert.equal(videoUrl, '');
});

test('archives the source page text as a snapshot', () => {
  const html = `<!doctype html><html><body><article>
    <h1>Bread</h1><p>Knead the dough for ten minutes.</p>
  </article></body></html>`;
  const { sourceText } = extractRecipeFromHtml(html, URL);
  assert.match(sourceText, /Knead the dough for ten minutes/);
});

test('verbatim recipes carry the video link and source snapshot', () => {
  const recipe = buildVerbatimRecipe({
    extracted: {
      title: 'Toast',
      ingredients: [{ name: 'Bread', quantity: '', unit: '', notes: '' }],
      steps: [{ text: 'Toast the bread.' }],
      tags: []
    },
    sourceText: 'Full original article text.',
    sourceUrl: URL,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  });
  assert.equal(recipe.videoUrl, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assert.equal(recipe.sourceSnapshot, 'Full original article text.');
});
