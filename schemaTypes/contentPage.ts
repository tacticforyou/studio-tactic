import {DocumentIcon} from '@sanity/icons/Document'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {PagePathInput} from '../components/PagePathInput.mjs'
import {getMainPage, validateMainPagePath} from '../structure/content-groups.mjs'

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
      components: {input: PagePathInput},
      readOnly: ({document}) => Boolean(getMainPage(document?._id)),
      validation: (rule) =>
        rule.required().custom(async (path, context) => {
          if (!path) return true
          if (!contentPath.test(path)) {
            return 'Use /about, /contact, a section root, or a lowercase slug under /services, /portfolio, or /blog.'
          }

          const mainPageValidation = validateMainPagePath(path, context.document?._id)
          if (mainPageValidation !== true) return mainPageValidation

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
      readOnly: ({document}) => Boolean(getMainPage(document?._id)),
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
      name: 'seoTitle',
      title: 'Search and sharing title',
      type: 'string',
      description:
        'Optional title for search results and social previews. The page title is used when empty.',
    }),
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
      name: 'teamIntro',
      title: 'Team introduction',
      type: 'text',
      rows: 3,
      hidden: ({document}) => document?.kind !== 'about',
    }),
    defineField({
      name: 'team',
      title: 'People of TACTIC',
      type: 'array',
      description:
        'Arrange the people cards here. Replace the illustrated stand-ins with your team’s photos, names and introductions when ready.',
      hidden: ({document}) => document?.kind !== 'about',
      of: [
        defineArrayMember({
          name: 'teamMember',
          title: 'Team member',
          type: 'object',
          fields: [
            defineField({
              name: 'isPlaceholder',
              title: 'Illustrated stand-in',
              type: 'boolean',
              initialValue: false,
              description:
                'Keep enabled for fictional portrait studies. Turn off after replacing the image and details with a real team member.',
            }),
            defineField({name: 'name', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'role', type: 'string', validation: (rule) => rule.required()}),
            defineField({
              name: 'bio',
              title: 'Short biography',
              type: 'text',
              rows: 3,
              validation: (rule) => rule.max(240),
            }),
            defineField({
              name: 'portrait',
              type: 'siteImage',
              description:
                'Use a 4:5 chest-up portrait with a simple background. Set the hotspot on the face and add descriptive alternative text.',
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {title: 'name', subtitle: 'role', media: 'portrait'},
          },
        }),
      ],
      validation: (rule) => rule.max(12),
    }),
    defineField({
      name: 'blocks',
      title: 'Page content',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'Heading 2', value: 'h2'},
            {title: 'Heading 3', value: 'h3'},
            {title: 'Quote', value: 'blockquote'},
          ],
          lists: [
            {title: 'Bullet', value: 'bullet'},
            {title: 'Numbered', value: 'number'},
          ],
          marks: {
            decorators: [
              {title: 'Bold', value: 'strong'},
              {title: 'Italic', value: 'em'},
              {title: 'Code', value: 'code'},
              {title: 'Underline', value: 'underline'},
              {title: 'Strikethrough', value: 'strike-through'},
            ],
            annotations: [
              {
                name: 'link',
                title: 'Link',
                type: 'object',
                fields: [
                  defineField({
                    name: 'href',
                    title: 'URL',
                    type: 'url',
                    validation: (rule) =>
                      rule
                        .required()
                        .uri({allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel']})
                        .custom((href) => {
                          if (!href) return true
                          if (
                            /[\u0000-\u0020\u007f\\]/.test(href) ||
                            href.startsWith('//') ||
                            !/^(?:\/|#|https?:|mailto:|tel:)/i.test(href)
                          ) {
                            return 'Use a web, email, telephone, root-relative, or anchor link.'
                          }
                          if (!href.startsWith('/') && !href.startsWith('#')) {
                            try {
                              const url = new URL(href)
                              if (url.username || url.password) {
                                return 'Links cannot contain embedded usernames or passwords.'
                              }
                            } catch {
                              return 'Enter a valid web, email, or telephone URL.'
                            }
                          }
                          return true
                        }),
                  }),
                  defineField({
                    name: 'openInNewTab',
                    title: 'Open in new tab',
                    type: 'boolean',
                    initialValue: false,
                  }),
                ],
              },
            ],
          },
        }),
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
