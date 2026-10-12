import assert from 'node:assert/strict'
import {test} from 'node:test'
import {Schema} from '@sanity/schema'
import {createStructureBuilder} from 'sanity/structure'
import {
  contentGroups,
  contentKinds,
  contentPageTemplates,
  contentTemplates,
} from './content-groups.mjs'
import {structure} from './index.ts'

test('sidebar groups keep the six supported kinds in separate sections', () => {
  assert.deepEqual(
    contentGroups.map(({title}) => title),
    ['Main Pages', 'Articles', 'Projects', 'Services'],
  )
  assert.deepEqual(contentGroups[0].kinds, ['about', 'contact', 'listing'])
  assert.deepEqual(
    contentGroups.slice(1).map(({kinds}) => kinds),
    [['article'], ['project'], ['service']],
  )
  assert.equal(new Set(contentKinds).size, 6)
})

test('each creation template belongs to exactly one matching group and starts as a draft', () => {
  for (const template of contentTemplates) {
    const groups = contentGroups.filter((group) => group.templates.includes(template.id))
    assert.equal(groups.length, 1)
    assert.ok(groups[0].kinds.includes(template.value.kind))
    assert.equal(template.schemaType, 'contentPage')
    assert.equal(template.value.status, 'draft')
    assert.deepEqual(template.value.blocks, [])
    assert.equal(template.value._id, undefined)
    assert.equal(template.value.publishedAt, undefined)
  }
  assert.equal(new Set(contentTemplates.map(({id}) => id)).size, contentTemplates.length)
})

test('main-page templates prefill existing supported paths, not detail-page slugs', () => {
  assert.deepEqual(
    contentTemplates.slice(0, 5).map(({value}) => value.path),
    ['/about', '/contact', '/services', '/portfolio', '/blog'],
  )
  for (const {value} of contentTemplates.slice(5)) assert.equal(value.path, undefined)
})

test('named templates replace generic contentPage creation without removing other document types', () => {
  const other = {id: 'author', title: 'Author', schemaType: 'author', value: {}}
  const previous = [
    {id: 'contentPage', title: 'Content page', schemaType: 'contentPage', value: {}},
    other,
  ]
  const before = globalThis.structuredClone(previous)
  assert.deepEqual(contentPageTemplates(previous), [other, ...contentTemplates])
  assert.deepEqual(previous, before)
})

test('structure sets scoped filters/templates, retains draft visibility, and has recovery navigation', () => {
  const templates = [
    ...contentTemplates,
    {id: 'author', title: 'Author', schemaType: 'author', value: {}},
  ]
  const source = {
    schema: Schema.compile({
      name: 'test',
      types: [
        {
          name: 'contentPage',
          type: 'document',
          fields: [
            {name: 'kind', type: 'string'},
            {name: 'path', type: 'string'},
          ],
        },
        {name: 'author', type: 'document', fields: [{name: 'name', type: 'string'}]},
      ],
    }),
    templates,
    i18n: {t: (key) => key},
    document: {
      singletons: [],
      resolveNewDocumentOptions: () =>
        templates.map(({id, title, schemaType}) => ({
          id,
          templateId: id,
          title,
          schemaType,
        })),
    },
  }
  const S = createStructureBuilder({source, perspectiveStack: ['drafts']})
  const {items} = structure(S, S.context).serialize()
  for (const [index, group] of contentGroups.entries()) {
    const pane = items[index].child
    assert.equal(pane.schemaTypeName, 'contentPage')
    assert.equal(pane.options.filter, '_type == "contentPage" && kind in $kinds')
    assert.deepEqual(pane.options.params, {kinds: group.kinds})
    assert.deepEqual(
      pane.initialValueTemplates.map(({templateId}) => templateId),
      group.templates,
    )
    assert.equal(pane.options.apiVersion, '2026-02-01')
    assert.ok(!pane.options.filter.includes('status'))
    assert.ok(!pane.options.filter.includes('drafts'))
    for (const template of group.templates) {
      assert.equal(pane.canHandleIntent('create', {type: 'contentPage', template}), true)
    }
    assert.equal(pane.canHandleIntent('create', {type: 'contentPage'}), false)
    assert.equal(pane.canHandleIntent('create', {template: 'unknown'}), false)
    assert.equal(pane.canHandleIntent('edit', {type: 'contentPage', id: 'document'}), false)
  }
  assert.equal(items[4].type, 'divider')
  assert.equal(items[5].title, 'Unclassified')
  assert.equal(
    items[5].child.options.filter,
    '_type == "contentPage" && (!defined(kind) || !(kind in $kinds))',
  )
  assert.deepEqual(items[5].child.initialValueTemplates, [])
  assert.deepEqual(items[5].child.options.params, {kinds: contentKinds})
  assert.equal(items[5].child.canHandleIntent('create', {}), false)
  assert.equal(items[5].child.canHandleIntent('edit', {}), false)
  assert.equal(items[6].id, 'author')
})
