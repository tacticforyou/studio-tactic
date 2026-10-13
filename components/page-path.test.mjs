import assert from 'node:assert/strict'
import {test} from 'node:test'
import {contentPage} from '../schemaTypes/contentPage.ts'
import {mainPages} from '../structure/content-groups.mjs'
import {PagePathInput} from './PagePathInput.mjs'
import {generateContentPath} from './page-path.mjs'

test('path generation keeps the stored string field and singleton read-only controls', () => {
  const field = contentPage.fields.find(({name}) => name === 'path')
  assert.equal(field.type, 'string')
  assert.equal(field.components.input, PagePathInput)
  for (const {documentId} of mainPages) {
    assert.equal(field.readOnly({document: {_id: documentId}}), true)
  }
  assert.equal(field.readOnly({document: {_id: 'ordinary-document'}}), false)
})

test('title generation uses the correct section for each repeatable kind', () => {
  for (const [kind, prefix] of [
    ['article', '/blog'],
    ['project', '/portfolio'],
    ['service', '/services'],
  ]) {
    assert.equal(
      generateContentPath({title: 'Considered Design', kind}),
      `${prefix}/considered-design`,
    )
  }
})

test('generation follows Sanity slug transliteration and symbol normalization', () => {
  assert.equal(
    generateContentPath({title: '  Cr\u00e8me Br\u00fbl\u00e9e & Design!  ', kind: 'article'}),
    '/blog/creme-brulee-and-design',
  )
  assert.equal(
    generateContentPath({title: 'Web / App -- Design 2026', kind: 'service'}),
    '/services/web-app-design-2026',
  )
})

test('missing titles, empty slugs, and nonrepeatable kinds cannot generate a path', () => {
  for (const title of [undefined, null, 123, '', '   ', '!!!']) {
    assert.equal(generateContentPath({title, kind: 'article'}), undefined)
  }
  for (const kind of [undefined, 'about', 'contact', 'listing', 'unknown', '__proto__']) {
    assert.equal(generateContentPath({title: 'Page title', kind}), undefined)
  }
})

test('singleton identities stay protected even if their kind is incorrect', () => {
  for (const {documentId} of mainPages) {
    for (const _id of [documentId, `drafts.${documentId}`, `versions.test.${documentId}`]) {
      assert.equal(generateContentPath({_id, title: 'New title', kind: 'article'}), undefined)
    }
  }
})

test('long generated slugs stay within the limit without a trailing separator', () => {
  const result = generateContentPath({title: 'Considered design '.repeat(40), kind: 'project'})
  assert.ok(result.startsWith('/portfolio/'))
  const slug = result.slice('/portfolio/'.length)
  assert.ok(slug.length <= 200)
  assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/)
})
