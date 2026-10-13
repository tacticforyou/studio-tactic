# Tactic Studio

Standalone Sanity Studio for project `bpblgmmr`, dataset `production`. The Next.js
website stays in the sibling `tacticforyou` folder.

## Overview dashboard

The default Studio home is `/dashboard`, labeled **Overview** in the tool menu.
The official `@sanity/dashboard` tool renders a project-specific widget built with
Sanity UI. Existing `/structure` URLs and content editing remain unchanged.

Overview includes section counts and shortcuts, new Article/Project/Service
actions using the existing templates, the five Main Page editors, and six recently
edited documents. Unclassified content stays accessible through a review link when
present. It performs read-only queries on mount and on **Refresh content**, without
polling, new credentials, or dataset mutations.

The `drafts` perspective merges draft/published pairs for totals and recent edits.
A separate `published` query counts **Approved** documents when their Approval
status is Published. Unpublished changes do not hide the previously approved
published snapshot. These are content approval counts, not a website availability
check: the website also validates page metadata and routes. Content bodies and
image assets are not fetched by the dashboard.

`DashboardRoutingLayout` wraps the default Studio layout in a project-owned React
context to resolve category links before tool-level routing is scoped. The links
use the public `useRouter().resolvePathFromState()` and `Link` APIs, preserving
base paths, browser modifier clicks, and existing structure routes. It does not
replace the Studio layout or manipulate Sanity's internal router context.
Singleton document links target their existing named Main Page panes; repeatable
documents use Sanity's standard edit intents.

Configuration and queries live in `dashboard/`. No Next.js changes or migration
are required. Deploy the Studio through Vercel to update `studio.tacticforyou.com`;
Sanity auto-updates do not deploy custom dashboard code. No hosting settings or
remote deployments are changed by adding this dashboard.

Dashboard commands (from this Studio folder):

```sh
npm install @sanity/dashboard@^6.0.21 @sanity/ui@^4.4.4
npm run test:dashboard
npm run test:structure
npm run typecheck
npm run lint
npm run build
```

Production builds now bundle the locally installed Studio and dashboard together.
This avoids the mixed-version Sanity UI styles that made dashboard buttons cover
the viewport in the auto-updating deployment. No inline-style overrides or
generated CSS class patches are used.

## Content navigation

- **Main Pages:** singleton editors for About, Contact, and the Services,
  Portfolio, and Blog overviews. Each opens its existing production document.
- **Articles:** individual blog posts.
- **Projects:** individual portfolio projects.
- **Services:** individual service pages.
- **Unclassified:** documents with a missing or unknown Page kind, plus
  noncanonical main-page documents imported or created before singleton setup.
  This recovery view has no create action; it keeps content accessible for manual
  cleanup rather than deleting or hiding it.

The grouping uses the existing `contentPage.kind` field. Drafts remain visible
alongside published content. The five singleton bindings reuse existing document
IDs: no content was copied, migrated, deleted, or published. Field names/types,
approval settings, and team permissions are unchanged. Studio navigation and
validation are not Content Lake access-control boundaries.

Main Pages has no create action and singleton documents have no Duplicate action.
Their path and kind are read-only; validation also reserves those five paths for
the designated IDs. Existing Delete and Unpublish controls remain available. If
a main page is deleted, its singleton editor recreates the same fixed document ID
with the correct path/kind and Draft approval status, not a second page.

Article, Project, and Service creation remains repeatable. Each section offers
its matching template, prefilled with the correct kind and Draft approval status.
Editors enter their own path and content. Existing path uniqueness and kind/path
validation still apply. The global create menu offers only these three named
templates; Sanity's generated singleton templates stay registered but hidden
from creation menus.

Configuration lives in `structure/index.ts` and `structure/content-groups.mjs`,
wired into `structureTool`, `document.singletons`, and `schema.templates` in
`sanity.config.ts`. The binding IDs are specific to this production dataset;
update them explicitly if connecting to a different dataset. Path safeguards
are applied in `schemaTypes/contentPage.ts`. Keep
`initialValueTemplates()` last in each pane's builder chain: the installed Sanity
builder can re-infer all type templates after later calls. Search results use
Sanity's fallback editor instead of incorrectly opening articles under Main Pages.

## Generated page paths

Article, Project, and Service editors have a **Generate** button beside Page path.
Enter a title and choose the page kind first. For example, `Considered Design`
generates `/blog/considered-design` for an Article, `/portfolio/considered-design`
for a Project, or `/services/considered-design` for a Service. Main Page paths
remain fixed and read-only, with no generator.

Generation is an explicit editor action, not an automatic reaction to title
changes. Existing values stay unchanged until an editor clicks Generate or edits
the path manually. Regenerating a published page's path changes its URL; this
feature does not create redirects. Existing uniqueness and kind/path validation
still apply, so duplicate paths must be resolved before publishing.

The stored `path` remains a string. Sanity's
[documented custom input API](https://www.sanity.io/docs/studio/form-components-reference)
adds the button without changing production data, schema field types, queries, or the
Next.js app. `speakingurl`, the same slugification library used by Sanity's native
slug input, is an explicit dependency; its type definitions are a development
dependency. Generated slugs are capped at 200 characters and must match the
website's lowercase ASCII route format. Empty or unsupported titles/kinds cannot
generate a path. Redeploy this standalone Studio through Vercel to show the
control to the team; no data migration or Next.js deployment is needed.

```sh
npm run test:inputs
```

## Dataset import and export

These commands use the official Sanity CLI and the configured project
`bpblgmmr`. They are terminal operations, not new Studio buttons. Sign in with
`npx sanity login` if needed; use a role with the appropriate dataset access.

Export production to a named file in the gitignored `backups` directory:

```sh
npm run dataset:export -- ./backups/production-2026-10-13.tar.gz
```

Use a fresh filename for later snapshots. The CLI creates missing parent
directories and refuses to overwrite an existing file unless `--overwrite` is
explicitly supplied. If no filename is supplied, the CLI may write
`production.tar.gz` in the Studio root; root-level `.tar.gz` files are also
gitignored. Exports contain drafts and asset binaries by default. Treat them as
private and store them securely outside Git. Check the output for failed asset
downloads: a completed export can still report missing binaries. Do not use
`--no-assets` for a restorable snapshot because it strips asset references.

Imports write to Content Lake. Test with an empty non-production dataset before
restoring production. For example, if a `staging` dataset already exists:

```sh
npm run dataset:import -- ./backups/production-2026-10-13.tar.gz --dataset staging
```

The import script does not hardcode a target dataset or an overwrite option.
Always choose the target deliberately with `--dataset`; otherwise the CLI asks
you to choose one. Existing document IDs are not replaced by default. `--missing`
skips existing IDs; `--replace` overwrites matching IDs and must only be added
after reviewing the destination and taking a snapshot. It does not delete extra
documents in the target. Imports can partially apply, bypass Studio validation,
and trigger webhooks or functions. Imported published documents may become
public immediately. Importing arbitrary content does not reserve website paths
or remap the five singleton IDs for you; review imported content before use.

These exports are content snapshots, not full project backups: Studio source,
configuration, permissions, and revision history are separate. No export, import,
dataset creation, or production mutation was performed while adding these scripts.
No new credentials or environment variables are required by this setup.

References: [Exporting data](https://www.sanity.io/docs/content-lake/exporting-data),
[Importing data](https://www.sanity.io/docs/content-lake/importing-data),
and [Sanity dataset commands](https://www.sanity.io/docs/cli-reference/cli-datasets).

## Run and deploy

Start development manually with `npm run dev`; the default URL is
[localhost:3333](http://localhost:3333). Existing content edits still require
approval and publishing before they appear on the website.

The Studio is hosted only on Vercel at
[studio.tacticforyou.com](https://studio.tacticforyou.com). Rebuild/redeploy the
**Studio's Vercel project** after schema, editor, or dashboard changes. Its build
command is `npm run build`, and the generated output directory is `dist`.
`npm run deploy` targets Sanity's hosting service, not this Vercel deployment.

`sanity.cli.ts` defaults to this Studio's registered application ID,
`pox5j4a3sxe0k851s2duo72h`. `SANITY_STUDIO_APP_ID` remains an optional build-time
override; it is no longer required for this Vercel deployment. If already set in
Vercel, keep it equal to the registered application ID above. Do not use an ID for
a deleted application.
`deployment.autoUpdates: false` disables CDN-delivered Studio core updates. The
Studio and dashboard use the same locally bundled Sanity UI dependency instead
of combining local dashboard styles with a separately updated CDN core. This is
Sanity's [documented opt-out](https://www.sanity.io/docs/studio/latest-version-of-sanity#opting-out),
not a requirement for every dashboard.

Upgrade Studio dependencies deliberately, run the checks above, and rebuild and
redeploy through Vercel to receive software updates. Content editing and publishing
are unchanged; publishing content does not require a rebuild. This setting takes
effect for the team only after the Studio's Vercel project is rebuilt and deployed.
There are no new environment variables. The app-ID override remains supported.
Re-enable auto-updates only after the mixed-version styling issue is resolved and
an auto-updating production build has been verified.
No remote Vercel or Sanity settings or deployments were changed by this edit.

The CLI config imports Node's public `node:process` module. The Studio's development
dependency `@types/node` and `tsconfig.json`'s `types: ["node"]` explicitly enable
Node typings for TypeScript 6; they do not change the Studio runtime.

App-ID verification commands (from this Studio folder):

```sh
npm install --save-dev @types/node@22
npm run lint
npm run typecheck
npx prettier --check sanity.cli.ts README.md
git diff --check
```

The Node typings addition was separately approved after type checking reported
missing `process`/`node:process` definitions. CLI configuration checks use public
Node imports without changing persistent environment variables or remote settings.

## Previous grouping verification and commands

Commands ran through `wsl.exe -d Ubuntu --cd
/home/garfield/projects/tactic/studio-tactic --`:

```sh
npm run lint
npm run typecheck
npm run test:structure
npm run schema:validate
npm run build
npm run build -- --no-auto-updates
git diff HEAD -- sanity.config.ts structure/index.ts structure/content-groups.mjs package.json
git diff --check HEAD
git status --short
npx prettier --write sanity.config.ts package.json structure/index.ts structure/content-groups.mjs structure/content-groups.test.mjs
npx prettier --write README.md structure/index.ts
npx prettier --write package.json structure/content-groups.test.mjs README.md
```

Lint, type checking, five focused tests, and schema validation passed (zero schema
errors/warnings). The default build received HTTP 403 from the auto-update CDN;
the temporary `--no-auto-updates` build passed without changing the then-enabled
auto-update setting. That flag is deprecated by the CLI; current builds use the
saved `deployment.autoUpdates: false` setting described above. Formatting
rewrote only the named local files. Git checks were read-only and found no
whitespace errors.

The structure regression test serializes Sanity's real builder, including its
template inference behavior. It uses Sanity's bundled browser-stub loader to run
under Node without opening a browser; Node prints experimental-loader warnings.

`Get-Content`, `Get-ChildItem`, and `rg` inspected the skill, installed APIs,
configuration, and files. `Test-NetConnection localhost -Port 3333
-InformationLevel Quiet` initially returned false. The user then started the
development server; the agent did not start or restart it. Browser verification
used that server and a user-completed login. It confirmed separate lists, five
main-page choices, scoped detail creation links, no Unclassified create action,
the named global create menu, and existing article search/edit navigation.
No documents were created, modified, deleted, or published during verification.
A screenshot was saved outside the repository as `studio-groups.png` in this
chat's visualization directory. The Next.js worktree remained unchanged.

## Singleton update commands

Commands ran through the same WSL prefix:

```sh
npx sanity documents query '*[_type == "contentPage"]{_id, path, kind, title, status}' --api-version 2026-02-01 --perspective raw
npx sanity documents query "*[_type == 'contentPage']{_id,path,kind,title,status}" --api-version 2024-01-01
npx prettier --write sanity.config.ts structure/content-groups.mjs structure/index.ts schemaTypes/contentPage.ts
npx prettier --write structure/content-groups.test.mjs
npx prettier --write README.md
npx prettier --check sanity.config.ts structure/content-groups.mjs structure/index.ts schemaTypes/contentPage.ts structure/content-groups.test.mjs README.md
npm run lint
npm run typecheck
npm run test:structure
npm run schema:validate
npm run build -- --no-auto-updates
npx eslint structure/content-groups.test.mjs
git diff -- sanity.config.ts structure/content-groups.mjs structure/index.ts schemaTypes/contentPage.ts
git diff --check
git diff --check -- structure/content-groups.test.mjs
git status --short
```

The first read-only query failed because this CLI has no `--perspective` flag.
The corrected query used the pre-2025 API's raw default and found one existing
document ID for each main path, with no extra draft IDs at those paths.
No dataset mutation was performed. Lint, type checking, all 11 tests, and schema
validation passed. The native tests resolve an unauthenticated Sanity source
with network requests rejected, verify singleton templates/actions, and evaluate
the recovery GROQ locally. The first test run had one incorrect assertion about
empty paths; it was corrected to leave missing-value handling to `required()`.
The local build passed using the temporary deprecated `--no-auto-updates` flag;
that historical check left auto-updates enabled. Current builds use the saved
`deployment.autoUpdates: false` setting described above. The build only regenerated
ignored local output; it did not deploy the Studio. Formatting changed only the
named files. Git checks found no whitespace errors. `Get-Content`,
`Get-ChildItem`, `rg`, and `git status --short` inspected local files and the
installed singleton API. Read-only Node probes checked native template/action
resolution without Content Lake requests. A Windows wildcard-path `rg` attempt
failed and did not change any files. Browser checks used the user's existing
server and login: Main Pages showed five fixed entries without a create action,
About opened existing content with a Singleton badge, its path/kind were locked,
Duplicate was absent, and the global create menu showed only the three repeatable
types. No document fields or Publish/Delete actions were touched. The Next.js
worktree remained unchanged. The agent did not start or restart any server.

Reference: [Singleton documents](https://www.sanity.io/docs/studio/structure-builder-cheat-sheet#singleton-documents),
[Structure Builder](https://www.sanity.io/docs/studio/structure-builder-reference)
and [initial value templates](https://www.sanity.io/docs/studio/initial-value-templates).
