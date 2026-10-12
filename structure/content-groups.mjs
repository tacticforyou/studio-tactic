import {getPublishedId} from 'sanity'

// Pin the existing production documents without rewriting IDs or migrating content.
export const mainPages = [
  {
    id: 'page-about',
    title: 'About',
    documentId: '6f9fef32-5bed-499c-be1e-09007191baba',
    kind: 'about',
    path: '/about',
  },
  {
    id: 'page-contact',
    title: 'Contact',
    documentId: 'b9f47bda-d3af-4a36-9b17-52a9d8505029',
    kind: 'contact',
    path: '/contact',
  },
  {
    id: 'page-services',
    title: 'Services overview',
    documentId: 'a33d76c0-6f12-4926-9276-2759024908aa',
    kind: 'listing',
    path: '/services',
  },
  {
    id: 'page-portfolio',
    title: 'Portfolio overview',
    documentId: '6cf9fbe2-a09b-4a75-9a20-1abd092baf39',
    kind: 'listing',
    path: '/portfolio',
  },
  {
    id: 'page-blog',
    title: 'Blog overview',
    documentId: 'a2cefacb-46d9-4d1a-8519-5546d57197b8',
    kind: 'listing',
    path: '/blog',
  },
]

export const contentGroups = [
  {
    id: 'main-pages',
    title: 'Main Pages',
    kinds: ['about', 'contact', 'listing'],
    templates: [],
  },
  {id: 'articles', title: 'Articles', kinds: ['article'], templates: ['page-article']},
  {id: 'projects', title: 'Projects', kinds: ['project'], templates: ['page-project']},
  {id: 'services', title: 'Services', kinds: ['service'], templates: ['page-service']},
]

export const contentKinds = contentGroups.flatMap((group) => group.kinds)

/** @type {import('sanity').Template[]} */
export const contentTemplates = [
  {id: 'page-article', title: 'Article', kind: 'article'},
  {id: 'page-project', title: 'Project', kind: 'project'},
  {id: 'page-service', title: 'Service', kind: 'service'},
].map(({id, title, kind}) => ({
  id,
  title,
  schemaType: 'contentPage',
  value: {kind, status: 'draft', blocks: []},
}))

/** @param {import('sanity').Template[]} previous */
export function contentPageTemplates(previous) {
  return [
    ...previous.filter(
      (template) =>
        template.id !== 'contentPage' &&
        (!mainPages.some((page) => page.id === template.id) || Boolean(template.singleton)),
    ),
    ...contentTemplates,
  ]
}

/** @param {string | undefined} documentId */
export function getMainPage(documentId) {
  if (!documentId) return undefined
  const publishedId = getPublishedId(documentId)
  return mainPages.find((page) => page.documentId === publishedId)
}

/**
 * @param {string | undefined} path
 * @param {string | undefined} documentId
 */
export function validateMainPagePath(path, documentId) {
  if (!path) return true
  const page = getMainPage(documentId)
  if (page && path !== page.path) return `This main page must keep the "${page.path}" path.`
  const mainPage = mainPages.find((item) => item.path === path)
  if (mainPage && page !== mainPage) {
    return `Edit "${mainPage.title}" under Main Pages instead of creating another document for this path.`
  }
  return true
}
