import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'badge',
      title: 'Badge',
      description: 'Small label shown above the name, e.g. "Est. 2019".',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{type: 'block'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'priceRange',
      title: 'Price range',
      description: 'e.g. "R130 – R435"',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'variantDetails',
      title: 'Variant details',
      description: 'e.g. weights, types, sizes available.',
      type: 'string',
    }),
    defineField({name: 'photo', title: 'Photo', type: 'image', options: {hotspot: true}}),
    defineField({name: 'order', title: 'Display order', type: 'number'}),
  ],
  preview: {
    select: {title: 'name', subtitle: 'priceRange'},
  },
})
