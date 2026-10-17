import assert from 'node:assert/strict'
import {mkdirSync, writeFileSync} from 'node:fs'
import {getCliClient} from 'sanity/cli'

const id = '9714f99d-095d-41b9-b663-f5805c447ebf'
const client = getCliClient({apiVersion: '2026-02-01'}).withConfig({
  useCdn: false,
  perspective: 'raw',
})
assert.equal(client.config().projectId, 'bpblgmmr')
assert.equal(client.config().dataset, 'production')
const docs = await client.getDocuments([id, `drafts.${id}`])
assert(docs.some((doc) => doc?.title === 'First Article' && doc.kind === 'article'))
mkdirSync('output/first-article-refresh', {recursive: true})
writeFileSync(
  'output/first-article-refresh/originals.json',
  JSON.stringify({capturedAt: new Date().toISOString(), docs}, null, 2) + '\n',
  {flag: 'wx'},
)
console.log(JSON.stringify(docs, null, 2))
