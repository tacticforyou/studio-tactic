import assert from 'node:assert/strict'
import {test} from 'node:test'
import {CaseIcon} from '@sanity/icons/Case'
import {ComposeIcon} from '@sanity/icons/Compose'
import {EnvelopeIcon} from '@sanity/icons/Envelope'
import {ImagesIcon} from '@sanity/icons/Images'
import {UsersIcon} from '@sanity/icons/Users'
import {createClient} from '@sanity/client'
import {evaluate, parse} from 'groq-js'
import {of} from 'rxjs'
import {createSourceFromConfig, defineSingleton} from 'sanity'
import {createStructureBuilder, structureTool} from 'sanity/structure'
import {contentPage} from '../schemaTypes/contentPage.ts'
import {
  contentGroups,
  contentKinds,
  contentPageTemplates,
  contentTemplates,
  getMainPage,
  mainPages,
  validateMainPagePath,
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
  assert.deepEqual(contentGroups[0].templates, [])
})

test('only repeatable content has creation templates, with scoped draft defaults', () => {
  assert.deepEqual(
    contentTemplates.map(({id}) => id),
    ['page-article', 'page-project', 'page-service'],
  )
  for (const template of contentTemplates) {
    const groups = contentGroups.filter((group) => group.templates.includes(template.id))
    assert.equal(groups.length, 1)
    assert.ok(groups[0].kinds.includes(template.value.kind))
    assert.equal(template.schemaType, 'contentPage')
    assert.equal(template.value.status, 'draft')
    assert.deepEqual(template.value.blocks, [])
    assert.equal(template.value._id, undefined)
    assert.equal(template.value.path, undefined)
    assert.equal(template.value.publishedAt, undefined)
  }
  assert.equal(new Set(contentTemplates.map(({id}) => id)).size, contentTemplates.length)
})

test('the five main pages retain their existing production document identities', () => {
  assert.deepEqual(
    mainPages.map(({path}) => path),
    ['/about', '/contact', '/blog', '/portfolio', '/services'],
  )
  assert.deepEqual(
    mainPages.map(({documentId}) => documentId),
    [
      '6f9fef32-5bed-499c-be1e-09007191baba',
      'b9f47bda-d3af-4a36-9b17-52a9d8505029',
      'a2cefacb-46d9-4d1a-8519-5546d57197b8',
      '6cf9fbe2-a09b-4a75-9a20-1abd092baf39',
      'a33d76c0-6f12-4926-9276-2759024908aa',
    ],
  )
  assert.equal(new Set(mainPages.map(({id}) => id)).size, 5)
  assert.equal(new Set(mainPages.map(({documentId}) => documentId)).size, 5)
  for (const {id, kind, path} of mainPages) {
    assert.ok(id.startsWith('page-'))
    assert.ok(contentGroups[0].kinds.includes(kind))
    assert.ok(path.startsWith('/'))
  }
})

test('published, draft, and release IDs resolve to the same main page', () => {
  for (const page of mainPages) {
    for (const id of documentVersions(page.documentId)) assert.equal(getMainPage(id), page)
  }
  assert.equal(getMainPage(), undefined)
  assert.equal(getMainPage('ordinary-article'), undefined)
  assert.equal(getMainPage('drafts.ordinary-article'), undefined)
})

test('main-page routes are restricted to their designated documents', () => {
  for (const page of mainPages) {
    for (const id of documentVersions(page.documentId)) {
      assert.equal(validateMainPagePath(page.path, id), true)
      assert.equal(typeof validateMainPagePath('/blog/ordinary-article', id), 'string')
      assert.equal(validateMainPagePath('', id), true)
    }
    assert.equal(typeof validateMainPagePath(page.path, 'ordinary-article'), 'string')
    assert.equal(typeof validateMainPagePath(page.path, 'drafts.ordinary-article'), 'string')
    const otherPage = mainPages.find(({id}) => id !== page.id)
    assert.equal(typeof validateMainPagePath(page.path, otherPage.documentId), 'string')
  }
  for (const path of [
    '/blog/article-title',
    '/portfolio/project-title',
    '/services/service-title',
  ]) {
    assert.equal(validateMainPagePath(path, 'ordinary-document'), true)
    assert.equal(validateMainPagePath(path, 'drafts.ordinary-document'), true)
  }
})

test('schema locks main-page identity fields and guards reserved routes before uniqueness checks', async () => {
  const pathField = contentPage.fields.find(({name}) => name === 'path')
  const kindField = contentPage.fields.find(({name}) => name === 'kind')
  for (const page of mainPages) {
    for (const _id of documentVersions(page.documentId)) {
      assert.equal(pathField.readOnly({document: {_id}}), true)
      assert.equal(kindField.readOnly({document: {_id}}), true)
    }
  }
  for (const document of [{_id: 'ordinary-article'}, {_id: 'drafts.ordinary-project'}, undefined]) {
    assert.equal(pathField.readOnly({document}), false)
    assert.equal(kindField.readOnly({document}), false)
  }
  let validatePath
  const rule = {
    required: () => rule,
    custom: (validate) => {
      validatePath = validate
      return rule
    },
  }
  pathField.validation(rule)
  let fetches = 0
  const context = {
    document: {_id: mainPages[0].documentId},
    getClient: () => ({
      fetch: async () => {
        fetches += 1
        return 0
      },
    }),
  }
  assert.equal(typeof (await validatePath('/blog/incorrect', context)), 'string')
  assert.equal(fetches, 0)
  context.document = {_id: 'ordinary-article'}
  assert.equal(typeof (await validatePath('/about', context)), 'string')
  assert.equal(fetches, 0)
  assert.equal(await validatePath('/blog/ordinary-article', context), true)
  assert.equal(fetches, 1)
})

test('template filtering removes legacy main creation but retains native singleton and other templates', () => {
  const other = {id: 'author', title: 'Author', schemaType: 'author', value: {}}
  const singletons = mainPages.map(({id, title, kind, path}) => ({
    id,
    title,
    schemaType: 'contentPage',
    singleton: id,
    value: {kind, path},
  }))
  const legacyTemplates = mainPages.map(({id, title}) => ({
    id,
    title,
    schemaType: 'contentPage',
    value: {},
  }))
  const previous = [
    {id: 'contentPage', title: 'Content page', schemaType: 'contentPage', value: {}},
    ...legacyTemplates,
    ...singletons,
    other,
  ]
  const before = globalThis.structuredClone(previous)
  assert.deepEqual(contentPageTemplates(previous), [...singletons, other, ...contentTemplates])
  assert.deepEqual(previous, before)
})

test('native Sanity registry infers singleton templates without hiding ordinary creation', async () => {
  const source = await getSource()
  for (const page of mainPages) {
    const template = source.templates.find(({singleton}) => singleton === page.id)
    assert.equal(template.id, page.id)
    assert.equal(template.schemaType, 'contentPage')
    assert.equal(template.value.path, page.path)
    assert.equal(template.value.kind, page.kind)
  }
  assert.deepEqual(
    source.document
      .resolveNewDocumentOptions({type: 'global'})
      .filter(({schemaType}) => schemaType === 'contentPage')
      .map(({templateId}) => templateId),
    ['page-article', 'page-project', 'page-service'],
  )
  assert.ok(
    source.document
      .resolveNewDocumentOptions({type: 'global'})
      .some(({templateId}) => templateId === 'author'),
  )
})

test('native singleton actions remove duplicate only from registered main-page IDs', async () => {
  const source = await getSource()
  for (const {documentId} of mainPages) {
    for (const id of documentVersions(documentId)) {
      const actions = source.document.actions({schemaType: 'contentPage', documentId: id})
      assert.ok(actions.some(({action}) => action === 'publish'))
      assert.ok(!actions.some(({action}) => action === 'duplicate'))
    }
  }
  for (const documentId of ['ordinary-article', 'ordinary-project', 'ordinary-service']) {
    const actions = source.document.actions({schemaType: 'contentPage', documentId})
    assert.ok(actions.some(({action}) => action === 'duplicate'))
  }
})

test('actual Structure Builder opens main singleton documents and scopes repeatable panes', async () => {
  const {items} = await getStructure()
  assert.equal(items[0].title, 'Main Pages')
  const mainPane = items[0].child
  assert.equal(mainPane.type, 'list')
  assert.deepEqual(mainPane.initialValueTemplates ?? [], [])
  assert.equal(mainPane.items.length, 5)
  const expectedIcons = [UsersIcon, EnvelopeIcon, ComposeIcon, ImagesIcon, CaseIcon]
  for (const [index, page] of mainPages.entries()) {
    const item = mainPane.items[index]
    assert.equal(item.id, page.id)
    assert.equal(item.title, page.title)
    assert.equal(item.icon, expectedIcons[index])
    assert.equal(item.child.type, 'document')
    assert.equal(item.child.options.id, page.documentId)
    assert.equal(item.child.options.type, 'contentPage')
    assert.equal(item.child.options.template, page.id)
  }
  for (const [index, group] of contentGroups.entries()) {
    if (index === 0) continue
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
  assert.deepEqual(items[5].child.initialValueTemplates, [])
  assert.equal(items[5].child.canHandleIntent('create', {}), false)
  assert.equal(items[5].child.canHandleIntent('edit', {}), false)
  assert.equal(items[6].id, 'author')
})

test('recovery keeps legacy duplicates and incomplete documents reachable without listing canonical versions', async () => {
  const {items} = await getStructure()
  const recovery = items[5].child
  const canonicalDocuments = mainPages.flatMap((page) =>
    documentVersions(page.documentId).map((_id) => ({
      _id,
      _type: 'contentPage',
      kind: page.kind,
      path: page.path,
    })),
  )
  const recoveryDocuments = [
    {_id: 'unfinished-draft', _type: 'contentPage'},
    {_id: 'unknown-kind', _type: 'contentPage', kind: 'unknown'},
    ...mainPages.map(({kind, path}, index) => ({
      _id: `duplicate-main-${index}`,
      _type: 'contentPage',
      kind,
      path,
    })),
    {_id: 'wrong-main-kind', _type: 'contentPage', kind: 'article', path: '/about'},
    {_id: 'wrong-listing-path', _type: 'contentPage', kind: 'listing', path: '/blog/incorrect'},
  ]
  const ordinaryDocuments = [
    {_id: 'ordinary-article', _type: 'contentPage', kind: 'article', path: '/blog/article-title'},
    {
      _id: 'drafts.ordinary-project',
      _type: 'contentPage',
      kind: 'project',
      path: '/portfolio/project-title',
    },
    {
      _id: 'ordinary-service',
      _type: 'contentPage',
      kind: 'service',
      path: '/services/service-title',
    },
    {_id: 'ordinary-author', _type: 'author', kind: 'unknown'},
  ]
  const query = parse(`*[${recovery.options.filter}]._id`)
  const result = await evaluate(query, {
    dataset: [...canonicalDocuments, ...recoveryDocuments, ...ordinaryDocuments],
    params: recovery.options.params,
  })
  assert.deepEqual((await result.get()).sort(), recoveryDocuments.map(({_id}) => _id).sort())
})

let sourcePromise

function getSource() {
  sourcePromise ??= createSourceFromConfig({
    name: 'singleton-test',
    projectId: 'bpblgmmr',
    dataset: 'production',
    auth: {
      state: of({
        authenticated: false,
        currentUser: null,
        client: createClient({
          projectId: 'bpblgmmr',
          dataset: 'production',
          apiVersion: '2026-02-01',
          useCdn: false,
          fetch: () => Promise.reject(new Error('Tests must not make Content Lake requests.')),
        }),
      }),
    },
    plugins: [structureTool()],
    schema: {
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
      templates: contentPageTemplates,
    },
    document: {
      singletons: mainPages.map(({id, title, documentId, kind, path}) =>
        defineSingleton({
          id,
          title,
          documentId,
          schemaType: 'contentPage',
          initialValue: {kind, path, status: 'draft', blocks: []},
        }),
      ),
    },
  })
  return sourcePromise
}

async function getStructure() {
  const source = await getSource()
  const S = createStructureBuilder({source, perspectiveStack: ['drafts']})
  return structure(S, S.context).serialize()
}

function documentVersions(documentId) {
  return [documentId, `drafts.${documentId}`, `versions.release-test.${documentId}`]
}
