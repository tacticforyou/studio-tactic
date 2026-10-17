import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {createReadStream, readFileSync, writeFileSync} from 'node:fs'
import {getCliClient} from 'sanity/cli'

const directory = 'output/first-article-refresh'
const id = '9714f99d-095d-41b9-b663-f5805c447ebf'
const [original, originalDraft] = JSON.parse(readFileSync(`${directory}/originals.json`, 'utf8')).docs
const article = JSON.parse(readFileSync(`${directory}/content.json`, 'utf8'))
assert.equal(original?._id, id)
assert.equal(original.title, 'First Article')
assert.equal(original.kind, 'article')
assert.equal(original.status, 'published')
assert.equal(originalDraft, null)
const key = (value) => createHash('sha256').update(`${id}:${value}`).digest('hex').slice(0, 12)
const block = (text, style, position) => ({
  _key: key(`${position}:${style}`),
  _type: 'block',
  style,
  markDefs: [],
  children: [{_key: key(`${position}:${style}:span`), _type: 'span', text, marks: []}],
})
const blocks = [
  block(article.intro, 'normal', 'intro'),
  ...article.sections.flatMap((section, index) => [
    block(section.heading, 'h2', `section-${index}`),
    block(section.text, 'normal', `section-${index}`),
  ]),
]
assert.equal(blocks.filter((entry) => entry.style === 'h2').length, 5)
assert.equal(new Set(blocks.map((entry) => entry._key)).size, blocks.length)
const client = getCliClient({apiVersion: '2026-02-01'}).withConfig({
  useCdn: false,
  perspective: 'raw',
})
assert.equal(client.config().projectId, 'bpblgmmr')
assert.equal(client.config().dataset, 'production')
const changes = {
  title: article.title,
  description: article.description,
  eyebrow: article.eyebrow,
  blocks,
  updatedAt: new Date().toISOString(),
}
writeFileSync(`${directory}/proposed.json`, JSON.stringify({id, changes}, null, 2) + '\n')
console.log(JSON.stringify({
  id,
  path: original.path,
  title: changes.title,
  preservedAuthor: original.author,
  preservedPublishedAt: original.publishedAt,
  headings: article.sections.map(({heading}) => heading),
}, null, 2))

if (!process.argv.includes('--apply')) {
  console.log('Preview only; --apply uploads the hero, creates a guarded draft, and republishes.')
} else {
  const [current, currentDraft] = await client.getDocuments([id, `drafts.${id}`])
  assert.equal(current?._rev, original._rev, 'Published content changed; review a fresh snapshot.')
  assert.equal(currentDraft, null, 'A draft now exists; preserve and review it before proceeding.')
  const asset = await client.assets.upload('image', createReadStream(`${directory}/ai-creative-direction.png`), {
    filename: 'tactic-ai-creative-direction.png',
    title: 'AI creative direction — TACTIC journal',
  })
  writeFileSync(`${directory}/uploaded-asset.json`, JSON.stringify(asset, null, 2) + '\n')
  changes.hero = {
    _type: 'siteImage',
    asset: {_type: 'reference', _ref: asset._id},
    alt: article.heroAlt,
  }
  const createAction = {
    actionType: 'sanity.action.document.version.create',
    publishedId: id,
    baseId: id,
    versionId: `drafts.${id}`,
    ifBaseRevisionId: original._rev,
  }
  await client.action(createAction, {dryRun: true})
  const createResult = await client.action(createAction)
  writeFileSync(`${directory}/created-draft.json`, JSON.stringify(createResult, null, 2) + '\n')
  const draft = await client.getDocument(`drafts.${id}`)
  assert(draft)
  const editorialContent = (doc) => Object.fromEntries(Object.entries(doc).filter(([field]) =>
    !['_id', '_rev', '_createdAt', '_updatedAt', '_system'].includes(field),
  ))
  assert.deepEqual(editorialContent(draft), editorialContent(original), 'Draft content changed.')
  const saved = await client.patch(draft._id).ifRevisionId(draft._rev).set(changes).commit()
  assert.deepEqual(editorialContent(saved), {...editorialContent(original), ...changes})
  writeFileSync(`${directory}/prepared-draft.json`, JSON.stringify(saved, null, 2) + '\n')
  const publishAction = {
    actionType: 'sanity.action.document.publish',
    publishedId: id,
    draftId: saved._id,
    ifDraftRevisionId: saved._rev,
    ifPublishedRevisionId: original._rev,
  }
  await client.action(publishAction, {dryRun: true})
  const publishResult = await client.action(publishAction)
  const docs = await client.getDocuments([id, `drafts.${id}`])
  assert.deepEqual(editorialContent(docs[0]), {...editorialContent(original), ...changes})
  assert.equal(docs[1], null, 'Draft remains after publication.')
  assert.equal(docs[0].path, original.path)
  assert.equal(docs[0].publishedAt, original.publishedAt)
  assert.equal(docs[0].author, original.author)
  writeFileSync(`${directory}/published.json`, JSON.stringify({
    verifiedAt: new Date().toISOString(), publishResult, docs,
  }, null, 2) + '\n')
  console.log('Verified refreshed published article, five H2s, new hero, preserved URL/author/date, and no remaining draft.')
}
