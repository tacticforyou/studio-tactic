import {DocumentIcon} from '@sanity/icons/Document'
import {defineArrayMember, defineField, defineType} from 'sanity'

const contentPath =
  /^\/(?:about|contact|services|portfolio|blog)$|^\/(?:services|portfolio|blog)\/[a-z0-9]+(?:-[a-z0-9]+)*$/

function expectedKind(path: string) {
  if (path === '/about') return 'about'
  if (path === '/contact') return 'contact'
  if (['/services', '/portfolio', '/blog'].includes(path)) return 'listing'
  if (path.startsWith('/services/')) return 'service'
  if (path.startsWith('/portfolio/')) return 'project'
  if (path.startsWith('/blog/')) return 'article'
  return undefined
}

export const contentPage = defineType({
  name: 'contentPage',
  title: 'Content page',
  type: 'document',
  icon: DocumentIcon,
  initialValue: {status: 'draft', blocks: []},
  fields: [
    defineField({
      name: 'path',
      title: 'Page path',
      type: 'string',
      description: 'For example, /about, /blog, or /blog/considered-design.',
      validation: (rule) =>
        rule.required().custom(async (path, context) => {
          if (!path) return true
          if (!contentPath.test(path)) {
            return 'Use /about, /contact, a section root, or a lowercase slug under /services, /portfolio, or /blog.'
          }

          const id = context.document?._id?.replace(/^drafts\./, '')
          const client = context.getClient({apiVersion: '2026-02-01'})
          const count = await client.fetch<number>(
            'count(*[_type == "contentPage" && path == $path && !(_id in $ids)])',
            {path, ids: id ? [id, `drafts.${id}`] : []},
            {perspective: 'raw'},
          )
          return count === 0 || 'Another content page already uses this path.'
        }),
    }),
    defineField({
      name: 'kind',
      title: 'Page kind',
      type: 'string',
      options: {
        list: [
          {title: 'Section listing', value: 'listing'},
          {title: 'Service', value: 'service'},
          {title: 'Project', value: 'project'},
          {title: 'Article', value: 'article'},
          {title: 'About', value: 'about'},
          {title: 'Contact', value: 'contact'},
        ],
      },
      validation: (rule) =>
        rule.required().custom((kind, context) => {
          const path = context.document?.path
          if (!kind || typeof path !== 'string' || !contentPath.test(path)) return true
          return (
            kind === expectedKind(path) ||
            `This path requires the "${expectedKind(path)}" page kind.`
          )
        }),
    }),
    defineField({
      name: 'status',
      title: 'Approval status',
      type: 'string',
      description:
        'Only approved pages marked Published appear on the website after Studio publishing.',
      options: {
        list: [
          {title: 'Draft', value: 'draft'},
          {title: 'Published', value: 'published'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'description',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'eyebrow', title: 'Section label', type: 'string'}),
    defineField({name: 'hero', title: 'Hero image', type: 'siteImage'}),
    defineField({name: 'socialImage', title: 'Social sharing image', type: 'siteImage'}),
    defineField({
      name: 'blocks',
      title: 'Page content',
      type: 'array',
      of: [
        defineArrayMember({type: 'paragraphBlock'}),
        defineArrayMember({type: 'headingBlock'}),
        defineArrayMember({type: 'listBlock'}),
        defineArrayMember({type: 'imageBlock'}),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'author', type: 'string'}),
    defineField({
      name: 'publishedAt',
      title: 'Publication date',
      type: 'datetime',
      validation: (rule) =>
        rule.custom((value, context) => {
          if (
            context.document?.kind === 'article' &&
            context.document?.status === 'published' &&
            !value
          ) {
            return 'Published articles need a publication date for the journal feed.'
          }
          return true
        }),
    }),
    defineField({name: 'updatedAt', title: 'Last updated', type: 'datetime'}),
  ],
  orderings: [{title: 'Path', name: 'pathAsc', by: [{field: 'path', direction: 'asc'}]}],
  preview: {
    select: {title: 'title', path: 'path', status: 'status', media: 'hero'},
    prepare: ({title, path, status, media}) => ({
      title: title || 'Untitled page',
      subtitle: `${path || 'No path'} | ${status || 'draft'}`,
      media,
    }),
  },
})
