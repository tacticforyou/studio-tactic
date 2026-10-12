import {defineConfig, defineSingleton} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'
import {contentPageTemplates, mainPages} from './structure/content-groups.mjs'
import {overviewDashboard} from './dashboard'
import {DashboardRoutingLayout} from './dashboard/StudioNavigation'

export default defineConfig({
  name: 'default',
  title: 'tactic',

  projectId: 'bpblgmmr',
  dataset: 'production',

  studio: {components: {layout: DashboardRoutingLayout}},

  plugins: [
    overviewDashboard,
    structureTool({structure}),
    ...(process.env.NODE_ENV !== 'production' ? [visionTool()] : []),
  ],

  releases: {
    enabled: false,
  },

  scheduledDrafts: {
    enabled: false,
  },

  document: {
    singletons: mainPages.map(({id, documentId, title, kind, path}) =>
      defineSingleton({
        id,
        documentId,
        title,
        schemaType: 'contentPage',
        initialValue: {kind, path, status: 'draft', blocks: []},
      }),
    ),
  },

  schema: {
    types: schemaTypes,
    templates: contentPageTemplates,
  },
})
