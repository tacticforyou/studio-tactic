# First Article refresh — 2026-10-18

Replaced the published placeholder article with **AI Needs a Point of View: Directing Images with Intent** in Sanity project `bpblgmmr`, dataset `production`, document `9714f99d-095d-41b9-b663-f5805c447ebf`.

The article keeps `/blog/first-article`, its original author, and its publication date. Its title, description, section label, body, hero, and last-updated date are refreshed. The body has an unheaded introduction and five H2 sections for the website's table of contents. The optional social image stays empty so the existing hero fallback applies.

## Files and supported workflow

- `originals.json`: complete published document and absent draft before editing; exclusive backup.
- `content.json`: final prose and descriptive hero alternative text.
- `ai-creative-direction.png`: final generated hero copied into the project.
- `proposed.json`: prepared content patch.
- `uploaded-asset.json`: uploaded Sanity asset metadata.
- `created-draft.json`, `prepared-draft.json`, `published.json`: action results and verification snapshots.

`inspect.mjs` and `update.mjs` use the official installed Sanity CLI's `getCliClient` with `--with-user-token`. No credentials are saved. The update checks the published revision and absence of a draft, creates a version using the official action, patches with a revision guard, and publishes with guards on both draft and published revisions. The final read verifies all content plus preservation of other editorial fields and absence of a draft. No schema, website code, or server configuration changes are required.

## Hero generation

Generated with the built-in `image_gen` tool, then copied into this project. Original output: `C:/Users/Hayyaun/.codex/generated_images/01a14ab8-33c8-7f62-9a83-0879731ceda5/exec-4b5632de-7a1d-48e3-a157-b61f44c37c11.png`.

Final prompt:

> Use case: stylized-concept
> Asset type: landscape 16:9 editorial hero for TACTIC creative studio journal article 'AI Needs a Point of View: Directing Images with Intent'.
> Primary request: A minimal, sophisticated photographic still life about creative direction shaping an image. A single sculptural folded ivory sheet stands on a charcoal studio floor; a large translucent forest-green glass panel and a slim dark flag shape a precise beam of warm light across its curves, casting a distinctive green-edged shadow. The scene should look like a carefully art-directed miniature film set, tactile and physically plausible, with the gesture and silhouette legible at thumbnail size.
> Style/medium: premium independent design magazine art direction, photographic realism, refined tactile materials, restrained sculptural composition.
> Composition: wide landscape 16:9, balanced asymmetry, generous breathing room, the entire main sculptural form within the central two thirds so square and mobile crops remain useful.
> Lighting/mood: controlled soft directional studio lighting, deep charcoal atmosphere with luminous ivory and rich forest green highlights.
> Constraints: no people, no computers, no cameras, no robot imagery, no text, letters, logos, or watermark. One resolved visual idea, no collage.

If a rollback is requested, use the saved original through a fresh draft workflow with current revision guards, preserving any newer changes to unrelated fields. The old image asset is retained.
