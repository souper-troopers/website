import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'shopItem',
  title: 'Shop item',
  type: 'document',
  description: 'One individually-purchasable item within a "grid of items" category (e.g. one Worry Doll style).',
  fields: [
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'productCategory'}],
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'price', title: 'Price (R)', type: 'number', validation: (rule) => rule.required()}),
    defineField({name: 'photo', title: 'Photo', type: 'image', options: {hotspot: true}}),
    defineField({name: 'description', title: 'Description', type: 'text', rows: 2}),
    defineField({name: 'order', title: 'Display order', type: 'number'}),
  ],
  preview: {
    select: {title: 'name', subtitle: 'price', media: 'photo'},
    prepare: ({title, subtitle, media}) => ({title, subtitle: subtitle ? `R${subtitle}` : undefined, media}),
  },
})
