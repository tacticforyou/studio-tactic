import {getCliClient} from 'sanity/cli'
import {readFileSync} from 'node:fs'
const entries = JSON.parse(readFileSync('output/article-heroes/manifest.json', 'utf8')).images
const client = getCliClient({apiVersion:'2026-02-01'}).withConfig({useCdn:false,perspective:'published'})
const docs = await client.fetch('*[_id in $ids]{_id,title,path,status,publishedAt,"hero":hero.asset._ref,"alt":hero.alt,"social":socialImage.asset._ref}',{ids:entries.map(e=>e.id)})
if(docs.length !== 4 || docs.some(d=>d.status !== 'published' || !d.hero || !d.alt || !d.publishedAt)) throw new Error('Incomplete publication')
console.log(JSON.stringify(docs,null,2))
