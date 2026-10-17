import {getCliClient} from 'sanity/cli'
import {mkdirSync, writeFileSync} from 'node:fs'

const ids = [
  'ffe7d239-82dc-466e-a8bc-654ef9dc285e',
  '92a39ded-f2b9-4acf-a157-09e9a9df5eb9',
  '4139c506-d282-43d7-be00-1a7dbb950b3e',
  'ae244d03-cdda-4b5c-8c2d-6ac34fbc35c1',
]
const client = getCliClient({apiVersion: '2026-02-01'}).withConfig({
  useCdn: false,
  perspective: 'raw',
})
if (client.config().projectId !== 'bpblgmmr' || client.config().dataset !== 'production') {
  throw new Error('Unexpected Sanity target')
}
const docs = await client.getDocuments(ids.flatMap((id) => [id, `drafts.${id}`]))
const snapshot = {capturedAt: new Date().toISOString(), projectId: 'bpblgmmr', dataset: 'production', docs}
mkdirSync('output/article-headings', {recursive: true})
writeFileSync('output/article-headings/originals.json', JSON.stringify(snapshot, null, 2) + '\n', {flag: 'wx'})
for (const doc of docs) {
  if (!doc) {
    console.log('No draft')
    continue
  }
  console.log(JSON.stringify(doc, null, 2))
}
