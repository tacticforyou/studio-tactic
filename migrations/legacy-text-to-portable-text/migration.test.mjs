import assert from 'node:assert/strict'
import {test} from 'node:test'
import migration from './index.ts'

test('draft and published documents only patch blocks with a revision guard', () => {
  for (const id of ['page', 'drafts.page', 'versions.release.page']) {
    const document = {
      _id: id,
      _type: 'contentPage',
      _rev: 'revision',
      status: id === 'page' ? 'published' : 'draft',
      publishedAt: '2026-10-12T09:00:00Z',
      updatedAt: '2026-10-12T10:00:00Z',
      blocks: [{_type: 'paragraphBlock', _key: 'text', text: 'Keep this writing'}],
    }
    const before = globalThis.structuredClone(document)
    const mutation = migration.migrate.document(document)
    assert.equal(mutation.id, id)
    assert.deepEqual(mutation.options, {ifRevision: 'revision'})
    assert.equal(mutation.patches.length, 1)
    assert.deepEqual(mutation.patches[0].path, ['blocks'])
    assert.equal(mutation.patches[0].op.type, 'set')
    assert.deepEqual(document, before)
  }
})

test('native migration skips converted content and refuses missing revisions', () => {
  assert.equal(migration.migrate.document({_id: 'page', blocks: []}), undefined)
  assert.throws(
    () =>
      migration.migrate.document({
        _id: 'page',
        blocks: [{_type: 'paragraphBlock', _key: 'text', text: 'Writing'}],
      }),
    /Missing revision/,
  )
  assert.deepEqual(migration.documentTypes, ['contentPage'])
})
