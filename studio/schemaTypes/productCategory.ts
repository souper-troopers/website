import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'productCategory',
  title: 'Shop category',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'Used in the URL, e.g. "worry-dolls" for /shop/worry-dolls',
      options: {source: 'name'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'blurb',
      title: 'Short description',
      description: 'Shown on the Shop landing page tile.',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'photo', title: 'Photo', type: 'image', options: {hotspot: true}}),
    defineField({
      name: 'displayMode',
      title: 'How this category is shown',
      type: 'string',
      options: {
        list: [
          {title: 'A grid of individual items (e.g. Worry Dolls, Gift Tags)', value: 'items'},
          {
            title: 'A single product with dropdown options (e.g. Coffee - weight/type)',
            value: 'attributes',
          },
        ],
        layout: 'radio',
      },
      initialValue: 'items',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Full description',
      description: 'Shown on the category page itself, above the products.',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'attributeVariants',
      title: 'Options (for "single product with dropdown options" categories only)',
      description: 'e.g. "250g, Ground Filter/Plunger" - R140. Ignored for grid-of-items categories.',
      type: 'array',
      hidden: ({document}) => document?.displayMode !== 'attributes',
      of: [
        {
          type: 'object',
          fields: [
            defineField({name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'price', title: 'Price (R)', type: 'number', validation: (rule) => rule.required()}),
          ],
          preview: {
            select: {title: 'label', subtitle: 'price'},
            prepare: ({title, subtitle}) => ({title, subtitle: subtitle ? `R${subtitle}` : undefined}),
          },
        },
      ],
    }),
    defineField({name: 'order', title: 'Display order', type: 'number'}),
  ],
  preview: {
    select: {title: 'name', subtitle: 'displayMode', media: 'photo'},
  },
})
