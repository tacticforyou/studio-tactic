import {ImageIcon} from '@sanity/icons/Image'
import {defineField, defineType} from 'sanity'

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
