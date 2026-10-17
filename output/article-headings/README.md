# Article heading update — 2026-10-17

Updated only the four articles created in this chat in Sanity project `bpblgmmr`,
dataset `production`. Each introductory paragraph remains unheaded. Existing
paragraphs, block/span keys, marks, images, publication dates, and other editorial
fields were preserved.

- `/blog/a-practical-brand-brief`: five H2s. Four existing heading lines were split
  from their paragraph spans into real H2 blocks; one heading was added above the
  final paragraph.
- `/blog/building-a-visual-identity-that-works`: five H2s.
- `/blog/designing-a-website-around-clear-next-steps`: five H2s.
- `/blog/motion-with-purpose`: six H2s.

The new H2 keys and span keys are deterministic SHA-256 prefixes derived from the
document ID, the related existing paragraph key, and the heading. The Studio's
`schemaTypes/contentPage.ts` already supports the `h2` block style.

## Supported APIs and concurrency guards

Used the official installed Sanity CLI and its `getCliClient`, authenticated with
`--with-user-token`. Scripts contain no token or secret values.

1. Read published and draft documents with the raw perspective and disabled CDN.
   Saved the complete originals before edits; all four drafts were absent.
2. Created drafts using `sanity.action.document.version.create`, with
   `ifBaseRevisionId` for each original published revision. All four creations
   were one action transaction, preceded by an API dry run.
3. Changed only `blocks` using a transaction of official `client.patch` operations
   guarded by `ifRevisionId` for every draft. Both the expected unchanged content
   and Sanity's automatic `_system.base` provenance were checked before patching.
4. Published all four drafts in one `sanity.action.document.publish` transaction,
   guarded by both `ifDraftRevisionId` and `ifPublishedRevisionId`, preceded by an
   API dry run.
5. Read all eight IDs again. Verified all 21 H2s, all original editorial content,
   and the absence of every draft. Published action transaction ID:
   `eiu79TX1NVj1DBWfKYYDTF`.

The first apply attempt stopped at the preservation assertion because the official
draft creation action adds `_system.base` automatically. It had not changed any
editorial content. The assertion was corrected to verify that platform metadata
separately, and `--resume-created-drafts` resumed the untouched drafts with the
same content and revision guards. No `_system` field was manually written or
removed.

Official documentation checked:

- <https://www.sanity.io/docs/content-lake/dispatch-actions>
- <https://www.sanity.io/docs/http-reference/actions>
- <https://tsdocs-client.sanity.dev/> (Publish Action revision parameters)
- Installed public `@sanity/client` types and README for `CreateVersionAction`,
  `PublishAction`, and transaction patch behavior.

## Audit files

- `originals.json`: complete published documents plus absent draft slots before
  modifications; created with exclusive write to avoid overwriting the backup.
- `proposed.json`: exact intended body arrays and original revisions.
- `created-drafts.json`: draft creation API transaction response.
- `created-draft-snapshot.json`: created draft documents before editing.
- `prepared-drafts.json`: patch transaction's returned documents.
- `publish-result.json`: publish API response.
- `published.json`: final verification snapshot and heading summary.
- `inspect.mjs`: backup/inspection script; refuses to overwrite `originals.json`.
- `update.mjs`: guarded preview/apply script. It intentionally refuses to reapply
  after publication because the published revisions no longer match the backup.

Commands that wrote files or content, from this Studio directory:

```sh
sanity exec output/article-headings/inspect.mjs --with-user-token
sanity exec output/article-headings/update.mjs --with-user-token
sanity exec output/article-headings/update.mjs --with-user-token -- --apply
sanity exec output/article-headings/update.mjs --with-user-token -- --apply --resume-created-drafts
```

The first command saved originals; preview wrote the proposed plan; the first
apply created untouched drafts and stopped; the resume patched and republished
them. The script never launches a development server.

If a rollback is requested, restore the `blocks` arrays from `originals.json`
through a fresh draft workflow with current revision guards and the same official
publish action. Preserve newer changes to all other editorial fields.
