import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'bbbeeBenefit',
  title: 'B-BBEE / tax benefit',
  type: 'document',
  description:
    'Benefits a business gets by supporting Souper Troopers, shown on the Get Involved page. These are regulated figures - check the "last verified" date in Site Settings before relying on them.',
  fields: [
    defineField({
      name: 'title',
      title: 'Benefit',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'value',
      title: 'Headline value',
      type: 'string',
      description: 'The short figure shown large, e.g. "25 points" or "135%".',
    }),
    defineField({
      name: 'body',
      title: 'Explanation',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'order', title: 'Display order', type: 'number'}),
  ],
  preview: {
    select: {title: 'title', subtitle: 'value'},
  },
})
