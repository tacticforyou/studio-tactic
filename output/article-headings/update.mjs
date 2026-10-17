import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync, writeFileSync} from 'node:fs'
import {getCliClient} from 'sanity/cli'

// This script intentionally refuses stale snapshots, existing drafts, and changed
// draft content. It changes only `blocks` on these four explicitly listed pages.
const directory = 'output/article-headings'
const snapshot = JSON.parse(readFileSync(`${directory}/originals.json`, 'utf8'))
const sections = [
  {
    id: 'ffe7d239-82dc-466e-a8bc-654ef9dc285e',
    path: '/blog/a-practical-brand-brief',
    headings: [
      ['f6b843b2f0d2', 'Begin with a specific audience', true],
      ['683882669ea4', 'Name the real problem', true],
      ['622572c8a187', 'Define the essentials', true],
      ['b0fdfdd91dc3', 'Agree on a useful measure of success', true],
      ['ebe5b7e6e454', 'Keep the brief useful'],
    ],
  },
  {
    id: '92a39ded-f2b9-4acf-a157-09e9a9df5eb9',
    path: '/blog/building-a-visual-identity-that-works',
    headings: [
      ['081e403fcd03', 'Give every element a role'],
      ['1ab7819212a4', 'Test the identity in real applications'],
      ['0b826605696b', 'Define repeatable rules'],
      ['166651c5d3ff', 'Build accessibility into the system'],
      ['6907df56d342', 'Make the handover practical'],
    ],
  },
  {
    id: '4139c506-d282-43d7-be00-1a7dbb950b3e',
    path: '/blog/designing-a-website-around-clear-next-steps',
    headings: [
      ['960ac4d6e966', 'Map the visitor journeys'],
      ['c5018bc3f2b4', 'Give each page a clear purpose'],
      ['fa5deda7e6ec', 'Shape content and layout together'],
      ['92ec15639f29', 'Design the complete mobile experience'],
      ['c085a5e24ca2', 'Review with realistic tasks'],
    ],
  },
  {
    id: 'ae244d03-cdda-4b5c-8c2d-6ac34fbc35c1',
    path: '/blog/motion-with-purpose',
    headings: [
      ['605bc0c48c77', 'Choose a motion vocabulary'],
      ['216cccd72a75', 'Connect motion to the visual identity'],
      ['072f2007ae6a', 'Use timing to guide attention'],
      ['fe56e1131290', 'Plan for each viewing context'],
      ['cdefab1067ea', 'Respect reduced motion preferences'],
      ['bfb92ce3af26', 'Document a system others can use'],
    ],
  },
]
const client = getCliClient({apiVersion: '2026-02-01'}).withConfig({
  useCdn: false,
  perspective: 'raw',
})
assert.equal(client.config().projectId, 'bpblgmmr')
assert.equal(client.config().dataset, 'production')
const originals = sections.map(({id, path}) => {
  const original = snapshot.docs.find((doc) => doc?._id === id)
  assert(original, `Missing original: ${id}`)
  assert.equal(original._type, 'contentPage')
  assert.equal(original.kind, 'article')
  assert.equal(original.path, path)
  assert.equal(original.status, 'published')
  assert(!snapshot.docs.some((doc) => doc?._id === `drafts.${id}`), `Original has draft: ${id}`)
  return original
})
const key = (value) => createHash('sha256').update(value).digest('hex').slice(0, 12)
const plans = sections.map((section, index) => {
  const original = originals[index]
  const blocks = structuredClone(original.blocks)
  const transformed = []
  for (const block of blocks) {
    const entry = section.headings.find(([blockKey]) => blockKey === block._key)
    if (entry) {
      const [, heading, splitExistingHeading] = entry
      const headingKey = key(`${section.id}:${block._key}:heading:${heading}`)
      transformed.push({
        _key: headingKey,
        _type: 'block',
        style: 'h2',
        markDefs: [],
        children: [{_key: key(`${headingKey}:span`), _type: 'span', text: heading, marks: []}],
      })
      if (splitExistingHeading) {
        assert.equal(block.children.length, 1, 'Review split when spans have changed')
        const prefix = `${heading}\n`
        assert(block.children[0].text.startsWith(prefix), 'Expected heading prefix changed')
        block.children[0].text = block.children[0].text.slice(prefix.length)
        // Verify that splitting retains the original heading and prose exactly.
        const previous = original.blocks.find((item) => item._key === block._key)
        assert.equal(`${heading}\n${block.children[0].text}`, previous.children[0].text)
      }
    }
    transformed.push(block)
  }
  assert.equal(transformed.filter((block) => block.style === 'h2').length, section.headings.length)
  assert.equal(new Set(transformed.map((block) => block._key)).size, transformed.length)
  assert.equal(transformed[0].style, 'normal', 'Introduction must remain a paragraph')
  // Every existing block and span keeps its key; only the four split text prefixes change.
  for (const previous of original.blocks) {
    const current = transformed.find((block) => block._key === previous._key)
    const expected = structuredClone(previous)
    const split = section.headings.find(([blockKey, , isSplit]) => blockKey === previous._key && isSplit)
    if (split) expected.children[0].text = expected.children[0].text.slice(split[1].length + 1)
    assert.deepEqual(current, expected)
  }
  return {id: section.id, title: original.title, originalRevision: original._rev, blocks: transformed}
})
writeFileSync(`${directory}/proposed.json`, JSON.stringify(plans, null, 2) + '\n')
const summary = plans.map((plan) => ({
  id: plan.id,
  title: plan.title,
  originalRevision: plan.originalRevision,
  headings: plan.blocks.filter((block) => block.style === 'h2').map((block) => block.children[0].text),
}))
console.log(JSON.stringify(summary, null, 2))

if (!process.argv.includes('--apply')) {
  console.log('Preview only. Pass --apply to create guarded drafts, patch blocks, and publish.')
} else {
  const ids = sections.flatMap(({id}) => [id, `drafts.${id}`])
  const current = await client.getDocuments(ids)
  const resumeCreatedDrafts = process.argv.includes('--resume-created-drafts')
  for (const [index, original] of originals.entries()) {
    assert.equal(current[index * 2]?._rev, original._rev, `Published content changed: ${original._id}`)
    if (!resumeCreatedDrafts) {
      assert.equal(current[index * 2 + 1], null, `A draft now exists: ${original._id}`)
    }
  }
  const content = (doc) => Object.fromEntries(
    Object.entries(doc).filter(([property]) => !['_id', '_rev', '_createdAt', '_updatedAt', '_system'].includes(property)),
  )
  const createActions = originals.map((original) => ({
    actionType: 'sanity.action.document.version.create',
    publishedId: original._id,
    baseId: original._id,
    versionId: `drafts.${original._id}`,
    ifBaseRevisionId: original._rev,
  }))
  if (resumeCreatedDrafts) {
    // The only resumable state is the untouched copies created by the action above.
    // All application content is verified below before any guarded patch is sent.
    assert(JSON.parse(readFileSync(`${directory}/created-drafts.json`, 'utf8')).transactionId)
  } else {
    await client.action(createActions, {dryRun: true})
    const createResult = await client.action(createActions)
    writeFileSync(`${directory}/created-drafts.json`, JSON.stringify(createResult, null, 2) + '\n', {flag: 'wx'})
  }
  const drafts = await client.getDocuments(sections.map(({id}) => `drafts.${id}`))
  writeFileSync(`${directory}/created-draft-snapshot.json`, JSON.stringify(drafts, null, 2) + '\n')
  let transaction = client.transaction()
  for (const [index, draft] of drafts.entries()) {
    assert(draft, `Draft creation was not visible: ${sections[index].id}`)
    // Sanity owns `_system`: version.create automatically records this provenance.
    assert.deepEqual(draft._system, {base: {id: originals[index]._id, rev: originals[index]._rev}})
    assert.deepEqual(content(draft), content(originals[index]), `Concurrent draft edit: ${draft._id}`)
    transaction = transaction.patch(draft._id, (patch) =>
      patch.ifRevisionId(draft._rev).set({blocks: plans[index].blocks}),
    )
  }
  const savedDrafts = await transaction.commit({returnDocuments: true, visibility: 'sync'})
  assert(Array.isArray(savedDrafts) && savedDrafts.length === 4)
  writeFileSync(`${directory}/prepared-drafts.json`, JSON.stringify(savedDrafts, null, 2) + '\n')
  const publishActions = plans.map((plan, index) => {
    const draft = savedDrafts.find((doc) => doc._id === `drafts.${plan.id}`)
    assert(draft, `Patched draft not returned: ${plan.id}`)
    assert.deepEqual(draft._system, drafts[index]._system, 'Sanity provenance must remain intact')
    assert.deepEqual(content(draft), {...content(originals[index]), blocks: plan.blocks})
    return {
      actionType: 'sanity.action.document.publish',
      publishedId: plan.id,
      draftId: draft._id,
      ifDraftRevisionId: draft._rev,
      ifPublishedRevisionId: plan.originalRevision,
    }
  })
  await client.action(publishActions, {dryRun: true})
  const publishResult = await client.action(publishActions)
  writeFileSync(`${directory}/publish-result.json`, JSON.stringify(publishResult, null, 2) + '\n')
  const published = await client.getDocuments(ids)
  for (const [index, plan] of plans.entries()) {
    const doc = published[index * 2]
    assert(doc, `Published document missing: ${plan.id}`)
    assert.deepEqual(content(doc), {...content(originals[index]), blocks: plan.blocks})
    assert.equal(published[index * 2 + 1], null, `Draft remains after publication: ${plan.id}`)
  }
  writeFileSync(`${directory}/published.json`, JSON.stringify({
    verifiedAt: new Date().toISOString(),
    summary,
    publishResult,
    docs: published,
  }, null, 2) + '\n')
  console.log('Verified all four published documents; headings are present, existing content is preserved, and no drafts remain.')
}
