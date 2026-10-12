import {BlockContentIcon} from '@sanity/icons/BlockContent'
import {ImageIcon} from '@sanity/icons/Image'
import {TextIcon} from '@sanity/icons/Text'
import {UlistIcon} from '@sanity/icons/Ulist'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const siteImage = defineType({
  name: 'siteImage',
  title: 'Image',
  type: 'image',
  icon: ImageIcon,
  options: {hotspot: true},
  validation: (rule) => rule.assetRequired(),
  fields: [
    defineField({
      name: 'alt',
      title: 'Alternative text',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
  ],
})

export const paragraphBlock = defineType({
  name: 'paragraphBlock',
  title: 'Paragraph',
  type: 'object',
  icon: TextIcon,
  fields: [
    defineField({
      name: 'text',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {select: {title: 'text'}, prepare: ({title}) => ({title, subtitle: 'Paragraph'})},
})

export const headingBlock = defineType({
  name: 'headingBlock',
  title: 'Heading',
  type: 'object',
  icon: BlockContentIcon,
  fields: [
    defineField({
      name: 'text',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {select: {title: 'text'}, prepare: ({title}) => ({title, subtitle: 'Heading'})},
})

export const listBlock = defineType({
  name: 'listBlock',
  title: 'List',
  type: 'object',
  icon: UlistIcon,
  fields: [
    defineField({
      name: 'items',
      type: 'array',
      of: [defineArrayMember({type: 'string', validation: (rule) => rule.required()})],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: {title: 'items.0'},
    prepare: ({title}) => ({title: title || 'List', subtitle: 'List'}),
  },
})

export const imageBlock = defineType({
  name: 'imageBlock',
  title: 'Image with caption',
  type: 'object',
  icon: ImageIcon,
  fields: [
    defineField({
      name: 'image',
      type: 'siteImage',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'caption', type: 'string'}),
  ],
  preview: {
    select: {title: 'caption', alt: 'image.alt', media: 'image'},
    prepare: ({title, alt, media}) => ({title: title || alt || 'Image', media}),
  },
})
