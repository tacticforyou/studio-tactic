export const contentGroups = [
  {
    id: 'main-pages',
    title: 'Main Pages',
    kinds: ['about', 'contact', 'listing'],
    templates: ['page-about', 'page-contact', 'page-services', 'page-portfolio', 'page-blog'],
  },
  {id: 'articles', title: 'Articles', kinds: ['article'], templates: ['page-article']},
  {id: 'projects', title: 'Projects', kinds: ['project'], templates: ['page-project']},
  {id: 'services', title: 'Services', kinds: ['service'], templates: ['page-service']},
]

export const contentKinds = contentGroups.flatMap((group) => group.kinds)

/** @type {import('sanity').Template[]} */
export const contentTemplates = [
  {id: 'page-about', title: 'About page', kind: 'about', path: '/about'},
  {id: 'page-contact', title: 'Contact page', kind: 'contact', path: '/contact'},
  {id: 'page-services', title: 'Services overview', kind: 'listing', path: '/services'},
  {id: 'page-portfolio', title: 'Portfolio overview', kind: 'listing', path: '/portfolio'},
  {id: 'page-blog', title: 'Blog overview', kind: 'listing', path: '/blog'},
  {id: 'page-article', title: 'Article', kind: 'article'},
  {id: 'page-project', title: 'Project', kind: 'project'},
  {id: 'page-service', title: 'Service', kind: 'service'},
].map(({id, title, kind, path}) => ({
  id,
  title,
  schemaType: 'contentPage',
  value: {kind, status: 'draft', blocks: [], ...(path ? {path} : {})},
}))

/** @param {import('sanity').Template[]} previous */
export function contentPageTemplates(previous) {
  return [...previous.filter((template) => template.id !== 'contentPage'), ...contentTemplates]
}
