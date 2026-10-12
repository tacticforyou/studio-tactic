import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'
import {contentPageTemplates} from './structure/content-groups.mjs'

export default defineConfig({
  name: 'default',
  title: 'tactic',

  projectId: 'bpblgmmr',
  dataset: 'production',

  plugins: [structureTool({structure}), visionTool()],

  schema: {
    types: schemaTypes,
    templates: contentPageTemplates,
  },
})
