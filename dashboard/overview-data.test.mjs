import assert from 'node:assert/strict'
import {test} from 'node:test'
import {evaluate, parse} from 'groq-js'
import {mainPages} from '../structure/content-groups.mjs'
import {
  documentGroup,
  documentStatus,
  overviewParams,
  overviewQuery,
  publishedQuery,
  structureLink,
} from './overview-data.ts'

// groq-js does not merge perspectives; fixtures represent Content Lake's normalized responses.
const mainDocuments = mainPages.map(({documentId, title, path, kind}, index) => ({
  _id: documentId,
  _originalId: index === 0 ? `drafts.${documentId}` : documentId,
  _type: 'contentPage',
  title,
  path,
  kind,
  status: index < 2 ? 'draft' : 'published',
  _updatedAt: '2026-10-01T00:00:00Z',
}))

const draftDocuments = [
  ...mainDocuments,
  page('article-approved', {kind: 'article', status: 'published'}),
  page('article-with-edits', {
    kind: 'article',
    status: 'draft',
    _originalId: 'drafts.article-with-edits',
  }),
  page('article-new', {kind: 'article', _originalId: 'drafts.article-new'}),
  page('project-not-approved', {kind: 'project'}),
  page('service-new', {kind: 'service', _originalId: 'drafts.service-new'}),
  page('duplicate-about', {kind: 'about', path: '/about'}),
  page('duplicate-overview', {kind: 'listing', path: '/blog'}),
  page('missing-kind'),
  page('unknown-kind', {kind: 'unknown'}),
  page('reserved-article-path', {kind: 'article', path: '/about'}),
  {_id: 'unrelated-author', _type: 'author', kind: 'article'},
]

const publishedDocuments = [
  ...mainDocuments.map((document, index) => ({
    ...document,
    _originalId: document._id,
    status: index === 1 ? 'draft' : 'published',
  })),
  page('article-approved', {kind: 'article', status: 'published'}),
  page('article-with-edits', {kind: 'article', status: 'published'}),
  page('project-not-approved', {kind: 'project'}),
  page('reserved-article-path', {kind: 'article'}),
]

test('overview counts normalized drafts once and keeps main-page counts canonical', async () => {
  const result = await runQuery(overviewQuery, draftDocuments)
  assert.deepEqual(result.groups, [
    {id: 'main-pages', total: 6, drafts: 1},
    {id: 'articles', total: 4, drafts: 2},
    {id: 'projects', total: 1, drafts: 0},
    {id: 'services', total: 1, drafts: 1},
  ])
  assert.deepEqual(
    result.mainPages.map(({_id}) => _id).sort(),
    mainPages.map(({documentId}) => documentId).sort(),
  )
  assert.equal(result.mainPages.filter(({_id}) => _id === mainPages[0].documentId).length, 1)
})

test('published snapshot approval remains independent of a changed draft approval field', async () => {
  const overview = await runQuery(overviewQuery, draftDocuments)
  const published = await runQuery(publishedQuery, publishedDocuments)
  assert.deepEqual(published.groups, [
    {id: 'main-pages', approved: 5},
    {id: 'articles', approved: 2},
    {id: 'projects', approved: 0},
    {id: 'services', approved: 0},
  ])
  assert.equal(overview.groups.find(({id}) => id === 'articles').drafts, 2)
  assert.deepEqual(
    published.mainPageIds.sort(),
    mainPages
      .filter((_, index) => index !== 1)
      .map(({documentId}) => documentId)
      .sort(),
  )
  assert.equal(
    documentStatus(overview.mainPages.find(({_id}) => _id === mainPages[0].documentId)),
    'Draft',
  )
  assert.ok(published.mainPageIds.includes(mainPages[0].documentId))
})

test('approval counts published approval state even when article metadata is incomplete', async () => {
  const incompleteArticle = {
    _id: 'incomplete-approved-article',
    _type: 'contentPage',
    kind: 'article',
    status: 'published',
  }
  const published = await runQuery(publishedQuery, [incompleteArticle])
  assert.deepEqual(published.groups, [
    {id: 'main-pages', approved: 0},
    {id: 'articles', approved: 1},
    {id: 'projects', approved: 0},
    {id: 'services', approved: 0},
  ])
  assert.equal(documentStatus(incompleteArticle), 'Approved')
  assert.equal(incompleteArticle.title, undefined)
  assert.equal(incompleteArticle.path, undefined)
  assert.equal(incompleteArticle.publishedAt, undefined)
})

test('unclassified counts incomplete documents, legacy main duplicates, and reserved paths', async () => {
  const result = await runQuery(overviewQuery, draftDocuments)
  assert.equal(result.unclassified, 5)
  const canonicalOnly = await runQuery(overviewQuery, mainDocuments)
  assert.equal(canonicalOnly.unclassified, 0)
})

test('recent edits include only content pages and are ordered deterministically with a six-item limit', async () => {
  const documents = [
    page('oldest', {_updatedAt: '2026-10-01T00:00:00Z'}),
    page('fourth', {_updatedAt: '2026-10-04T00:00:00Z'}),
    page('tie-b', {_updatedAt: '2026-10-07T00:00:00Z'}),
    page('sixth', {_updatedAt: '2026-10-02T00:00:00Z'}),
    page('newest', {_updatedAt: '2026-10-08T00:00:00Z'}),
    page('fifth', {_updatedAt: '2026-10-03T00:00:00Z'}),
    page('tie-a', {_updatedAt: '2026-10-07T00:00:00Z'}),
    {_id: 'author', _type: 'author', _updatedAt: '2026-10-09T00:00:00Z'},
  ]
  const result = await runQuery(overviewQuery, documents)
  assert.deepEqual(
    result.recent.map(({_id}) => _id),
    ['newest', 'tie-a', 'tie-b', 'fourth', 'fifth', 'sixth'],
  )
  assert.equal(result.recent[0]._updatedAt, '2026-10-08T00:00:00Z')
  assert.equal(result.recent[0].title, 'newest')
})

test('empty datasets and absent main documents return safe empty dashboard data', async () => {
  const overview = await runQuery(overviewQuery, [])
  const published = await runQuery(publishedQuery, [])
  assert.deepEqual(overview.mainPages, [])
  assert.deepEqual(overview.recent, [])
  assert.equal(overview.unclassified, 0)
  assert.ok(overview.groups.every(({total, drafts}) => total === 0 && drafts === 0))
  assert.deepEqual(published.mainPageIds, [])
  assert.ok(published.groups.every(({approved}) => approved === 0))
})

test('document statuses distinguish missing, draft, approved, and unapproved snapshots', () => {
  assert.equal(documentStatus(), 'Not created')
  assert.equal(documentStatus({_id: 'new', _originalId: 'drafts.new'}), 'Draft')
  assert.equal(
    documentStatus({_id: 'edited', _originalId: 'drafts.edited', status: 'published'}),
    'Draft',
  )
  assert.equal(documentStatus({_id: 'approved', status: 'published'}), 'Approved')
  assert.equal(documentStatus({_id: 'pending', status: 'draft'}), 'Not approved')
  assert.equal(documentStatus({_id: 'no-status'}), 'Not approved')
})

test('document group names use canonical identity for main pages and kind for repeatable content', () => {
  for (const {documentId} of mainPages) {
    assert.equal(documentGroup({_id: documentId}), 'Main Pages')
  }
  assert.equal(documentGroup({_id: 'article', kind: 'article'}), 'Articles')
  assert.equal(documentGroup({_id: 'project', kind: 'project'}), 'Projects')
  assert.equal(documentGroup({_id: 'service', kind: 'service'}), 'Services')
  assert.equal(documentGroup({_id: 'duplicate-about', kind: 'about'}), 'Unclassified')
  assert.equal(documentGroup({_id: 'missing-kind'}), 'Unclassified')
  assert.equal(documentGroup({_id: 'unknown-kind', kind: 'unknown'}), 'Unclassified')
})

test('structure links open group panes and named singleton editor panes', () => {
  assert.deepEqual(structureLink(), {tool: 'structure', structure: undefined})
  for (const {id} of overviewParams.groups) {
    assert.deepEqual(structureLink(id), {
      tool: 'structure',
      structure: {panes: [[{id}]]},
    })
  }
  for (const page of mainPages) {
    assert.deepEqual(structureLink('main-pages', page.id), {
      tool: 'structure',
      structure: {panes: [[{id: 'main-pages'}], [{id: page.id}]]},
    })
  }
  assert.deepEqual(structureLink('unclassified-pages'), {
    tool: 'structure',
    structure: {panes: [[{id: 'unclassified-pages'}]]},
  })
})

function page(_id, values = {}) {
  return {
    _id,
    _originalId: _id,
    _type: 'contentPage',
    title: _id,
    status: 'draft',
    _updatedAt: '2026-10-02T00:00:00Z',
    ...values,
  }
}

async function runQuery(query, dataset) {
  const result = await evaluate(parse(query), {dataset, params: overviewParams})
  return result.get()
}
