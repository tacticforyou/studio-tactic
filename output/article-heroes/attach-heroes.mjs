import {getCliClient} from 'sanity/cli'
import {createReadStream, writeFileSync, readFileSync} from 'node:fs'
const entries = JSON.parse(readFileSync('output/article-heroes/manifest.json', 'utf8')).images
const client = getCliClient({apiVersion: '2026-02-01'}).withConfig({useCdn: false})
async function main() {
  if (client.config().projectId !== 'bpblgmmr' || client.config().dataset !== 'production') throw new Error('Unexpected target')
  const results = []
  for (const e of entries) {
    const id = `drafts.${e.id}`
    const doc = await client.getDocument(id)
    if (!doc || doc.kind !== 'article' || doc.path !== e.path) throw new Error(`Unexpected document: ${id}`)
    if (doc.hero?.asset) throw new Error(`Hero already exists: ${id}`)
    const asset = await client.assets.upload('image', createReadStream(`output/article-heroes/${e.name}.png`), {filename: `${e.name}.png`})
    const patch = {hero: {_type: 'siteImage', asset: {_type:'reference', _ref:asset._id}, alt:e.alt}}
    if (!doc.publishedAt) patch.publishedAt = new Date().toISOString()
    const saved = await client.patch(id).ifRevisionId(doc._rev).set(patch).commit()
    results.push({id, title:saved.title, asset:asset._id, publishedAt:saved.publishedAt})
    console.log(JSON.stringify(results.at(-1)))
  }
  writeFileSync('output/article-heroes/attached.json', JSON.stringify(results,null,2))
}
main().catch(error => {console.error(error.message); process.exitCode=1})
