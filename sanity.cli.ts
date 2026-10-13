import process from 'node:process'
import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'bpblgmmr',
    dataset: 'production',
  },
  typegen: {
    enabled: true,
    path: '../tacticforyou/app/**/*.{ts,tsx,js,jsx}',
    schema: 'schema.json',
    generates: '../tacticforyou/sanity.types.ts',
    overloadClientMethods: true,
    // The sibling frontend's Prettier plugins resolve from a different package.
    formatGeneratedCode: false,
  },
  deployment: {
    appId: process.env.SANITY_STUDIO_APP_ID || 'pox5j4a3sxe0k851s2duo72h',
    // Bundle core and dashboard UI together to avoid mixed-version CSS collisions.
    autoUpdates: false,
  },
})
