import {at, defineMigration, patch, set} from 'sanity/migrate'
import {convertBlocks} from './convert-blocks.mjs'

export default defineMigration({
  title: 'Convert legacy page text to Portable Text',
  documentTypes: ['contentPage'],
  filter: 'count(blocks[_type in ["paragraphBlock", "headingBlock", "listBlock"]]) > 0',
  migrate: {
    document(document) {
      const blocks = convertBlocks(document.blocks)
      if (!blocks) return
      if (!document._rev) throw new Error(`Missing revision for ${document._id}`)
      // Reject concurrent edits rather than overwriting changes made after the export.
      return patch(document._id, [at('blocks', set(blocks))], {ifRevision: document._rev})
    },
  },
})
