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
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
  },
})
