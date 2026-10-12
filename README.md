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
SANITY_STUDIO_APP_ID=pox5j4a3sxe0k851s2duo72h npm run build
```

The standard build checks (default app ID and the Vercel override) encountered an
HTTP 403 while resolving Sanity's auto-update assets in this environment. No
deprecated build flags or auto-update setting changes were used to bypass it.

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

## Run and deploy

Start development manually with `npm run dev`; the default URL is
[localhost:3333](http://localhost:3333). Existing content edits still require
approval and publishing before they appear on the website.

To update the Sanity-hosted Studio, leave `SANITY_STUDIO_APP_ID` unset locally,
run `npm run deploy` from this folder, and reload
[the hosted Studio](https://tacticforyou.sanity.studio/). The navigation update has
not been deployed by the agent. No Next.js changes or deployment are needed for
this singleton/navigation update. The earlier Portable Text data cleanup is a
separate concern.

For the Vercel-hosted Studio at `studio.tacticforyou.com`, set
`SANITY_STUDIO_APP_ID=pox5j4a3sxe0k851s2duo72h` in the **Studio's Vercel project**
and rebuild/redeploy through Vercel. `sanity.cli.ts` reads this build-time override;
when it is unset or empty, it retains the original Sanity-hosted app ID
`jqjqywmnt0ans8h9nbkikwfl`. Do not put the Vercel value in your local environment
when you intend to deploy to the original `sanity.studio` instance.
`autoUpdates: true` is unchanged. Auto-updates update Sanity's core software, not
your schemas or custom navigation; code changes still need a new deployment.
No Vercel settings or deployments were changed by this configuration edit.

The app-ID change was checked with public Node imports of `sanity.cli.ts` in two
separate processes: unset and overridden `SANITY_STUDIO_APP_ID`. Assertions
confirmed the expected ID and `autoUpdates: true` in both cases; no network
requests, builds, deployments, or persistent environment changes were involved.

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
missing `process`/`node:process` definitions. Public `node
--experimental-strip-types --input-type=module -e` checks imported the actual CLI
config in separate processes and asserted the original fallback and Vercel
override, with auto-updates still enabled in both.

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
the temporary `--no-auto-updates` build passed without changing saved
`deployment.autoUpdates: true`. That flag is deprecated by the CLI. Formatting
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
saved `deployment.autoUpdates: true` is unchanged. The build only regenerated
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
