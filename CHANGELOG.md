# Changelog

## v0.9.0

- Fixed pinch-to-zoom being blocked on mobile: the root `html`/`body` used `overflow-x: hidden`, which established a scroll container that disabled zoom-panning. Switched to `overflow-x: clip`, which still prevents horizontal overflow but keeps zoom working (regression from the v0.5 mobile default-zoom fix).
- Keep-awake now works in a normal browser tab, not just an installed PWA (issue #10): the Screen Wake Lock is requested whenever the app is open and re-acquired after the tab regains focus, so the screen stays on while cooking. Requests still fail silently where the browser/battery saver disallows them.
- Recipe video link (issue #11): URL imports now capture the recipe's own video — preferring the JSON-LD `video`, then an in-content YouTube embed or `og:video` — and normalize YouTube links to a canonical `watch?v=` URL. Unrelated page videos are ignored. The field is editable in the wizard/edit form and left blank when none is found; shown on the detail and shared views.
- Source retention (issue #8): URL imports now archive the source page text with the recipe (`source_snapshot`) so the content survives if the original site goes offline. Shown in a collapsible "Saved source" panel on the detail page and included in personal backups.
- Toddler helper usability (issue #12): step illustrations now depict the actual ingredient and what happens to the food (e.g. chopped apple going into the bowl, mixing together) instead of a generic child figure, and each ingredient step states the metric amount so a non-reading toddler can see how much to add.
- Migration 010 adds `video_url` and `source_snapshot` columns.

## v0.8.1

- Added a protein/fat/carbs pie chart to the right of the nutrition block, showing the macronutrient mix by mass with a percentage legend. Rendered as inline SVG (no chart dependency), so it also appears when saving/printing a recipe.

## v0.8.0

- Added recipe nutrition estimates (issue #7, v1): a "Calculate nutrition" action on each recipe estimates calories, protein, carbs, fat, fiber, sugar, and sodium per serving and for the whole recipe, with the assumed serving count. Values are AI-estimated from the final ingredient list and shown with a clear "estimate only, not medical/dietary advice" disclaimer. Stored on the recipe and recalculable. (v2 healthy-balance assessment remains future work.)
- Added an optional expiry when creating a share link (no expiry by default): choose 1 hour, 24 hours, 7 days, or 30 days. Expired links stop resolving server-side, and the share dialog shows when a link expires.
- Backend: POST /api/recipes/:id/nutrition (auth) estimates and stores nutrition; share enable accepts a validated expiresInHours; migrations 008 (share_expires_at) and 009 (nutrition).

## v0.7.0

- Added per-recipe sharing (issue #4): a Share button on each recipe creates a private link that opens a clean, standalone read-only view of just that recipe — no sidebar, no access to the rest of the library. The link can be copied, shared via the device share sheet, or revoked ("Stop sharing").
- The shared view excludes diagnostic/comparative data: only the final ingredient list, method, and picture are shown — no pre-conversion original values, import source photos, source URL, or AI usage. Language switching is available when translations exist.
- Added "Save as PDF" on the shared view via a print-optimized layout, so a recipe can be shared as a PDF with just the final ingredients, method, and picture.
- Backend: public unauthenticated GET /api/share/:token returns a sanitized recipe; POST/DELETE /api/recipes/:id/share (auth-protected) enable/revoke sharing with a random token; migration 007 adds share_token/share_enabled.

## v0.6.0

- Added deterministic metric unit conversion with per-ingredient densities: dry/solid ingredients measured by volume now convert to grams using the density of that specific ingredient (1 cup flour ≈ 120 g, 1 cup desiccated coconut ≈ 85 g), and liquid ingredients convert to milliliters. Applied to all AI imports as a correction layer on top of strengthened AI conversion prompts, with unit tests.
- Added a server-side import content safety guard that rejects dangerous or illegal "recipes" (explosives, drugs, poisons, weapons) and prompt-injection remnants on all import paths, including verbatim imports that never pass through the AI screen. AI prompts were also hardened with explicit rejection rules.
- Photo imports now read handwritten recipes: the AI is instructed to carefully OCR printed and cursive handwriting in any language and flag unreadable parts instead of guessing.
- Added screen keep-awake (Wake Lock) when the app runs as an installed webapp, plus a web app manifest and icon so it can be installed as a PWA.
- Photo imports now store the uploaded source photos with the recipe, shown on the recipe page with a tap-to-enlarge lightbox; URL imports keep showing the source recipe link. Source photos are included in backups.
- Added cooking mode niceties: tap ingredients to tick them off and tap method steps to mark them done while cooking.
- Editing a recipe no longer drops the source URL, import mode, or stored source photos.
- Recipe edit image uploads now accept files up to 8 MB and automatically downscale large images before saving.
- Editing an ingredient amount now shows "(original ...)" behind the field and preserves the pre-edit amount with the recipe.

## v0.5.9

- Added import-time recipe translation selection for English, German, and Afrikaans.
- Added per-recipe language selection on recipe detail pages, separate from the UI language.
- Added per-recipe AI translation generation for existing recipes with token/cost usage added to recipe metrics.
- Expanded translated recipe views to include ingredients, ingredient notes, method steps, and display tag labels while preserving original source measurements.

## v0.5.8

- Added language-aware recipe display for translated AI-imported recipes while preserving original ingredient lines and source measurements.
- Added canonical category filters and tag matching to reduce multilingual tag duplication.
- Added editable recipe category filters in Settings and category filters on recipe search views.
- Improved mobile fit behavior and moved AI import usage stats to the end of recipe details for cleaner cooking views.
- Added Basic Auth protection and a management login prompt for Settings, imports, backups, and recipe/tag management while keeping recipe browsing public.
- Applied the TL Platform Design System direction with the TL Recipe Core amber accent, softer dark SaaS surfaces, sidebar account treatment, and richer empty states.
- Replaced interactive tag chips with multi-select dropdown controls for tag assignment and filtering.
- Added startup retry handling for temporary PostgreSQL DNS/readiness failures.
- Added AI-assisted photo import for up to five uploaded recipe photos.
- Hardened OpenAI import instructions to accept only edible food cooking recipes and ignore hidden AI-agent instructions in imported page content.
- Fixed API validation errors rendering as `[object Object]` in the frontend.
- Invalid import URLs now show the actual validation field message.
- Started maintaining this changelog.
- Added optional toddler-helper recipe creation for AI-assisted imports.
- Added generated toddler-safe image support for each toddler helper step.
- Added image model, image count, and image cost tracking for AI-created step images.

## v0.4.2

- Added running app version display under `Settings` -> `General`.

## v0.4.1

- Updated global npm in Docker and CI to avoid vulnerable `picomatch` and `brace-expansion` versions bundled in the Node base image.

## v0.4.0

- Added recipe editing.
- Added AI import cost snapshots based on token usage and selected model pricing.
- Added original ingredient values when AI imports convert values to metric.

## v0.1.0

- Initial TL Recipe Core MVP.
- Added recipe cards, detail pages, manual recipe wizard, URL import, tag/search, settings, PostgreSQL storage, Docker, CI, and documentation.
