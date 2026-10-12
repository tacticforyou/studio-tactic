# Tactic Studio

Standalone Sanity Studio for project `bpblgmmr`, dataset `production`. The Next.js
website stays in the sibling `tacticforyou` folder.

## Content navigation

- **Main Pages:** About, Contact, and the Services, Portfolio, and Blog overviews.
- **Articles:** individual blog posts.
- **Projects:** individual portfolio projects.
- **Services:** individual service pages.
- **Unclassified:** existing documents with a missing or unknown Page kind.
  Set their kind and a matching path to move them into the appropriate section.
  This recovery view has no create action.

The grouping uses the existing `contentPage.kind` field. Drafts remain visible
alongside published content. No document IDs, fields, content, approval settings,
or team permissions were changed, and no migration is needed for grouping.
These are navigation groups, not access-control boundaries.

Each section's create action offers only its matching templates. Main-page
templates prefill their existing supported path and kind; Article, Project, and
Service templates prefill only the kind so the editor can enter their own slug.
Every new document starts with Approval status Draft and empty Page content.
Existing path uniqueness and kind/path validation still apply. The global create
menu offers all eight named templates, not an unclassified Content page option.

Configuration lives in `structure/index.ts` and `structure/content-groups.mjs`,
wired into `structureTool` and `schema.templates` in `sanity.config.ts`. Keep
`initialValueTemplates()` last in each pane's builder chain: the installed Sanity
builder can re-infer all type templates after later calls. Search results use
Sanity's fallback editor instead of incorrectly opening articles under Main Pages.

## Run and deploy

Start development manually with `npm run dev`; the default URL is
[localhost:3333](http://localhost:3333). Existing content edits still require
approval and publishing before they appear on the website.

To update the team-facing Studio, run `npm run deploy` from this folder and reload
[the hosted Studio](https://tacticforyou.sanity.studio/). The navigation update has
not been deployed by the agent. No Next.js changes or deployment are needed for
this grouping. The earlier Portable Text data cleanup is a separate concern.

## Verification and commands

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

Reference: [Structure Builder](https://www.sanity.io/docs/studio/structure-builder-reference)
and [initial value templates](https://www.sanity.io/docs/studio/initial-value-templates).
