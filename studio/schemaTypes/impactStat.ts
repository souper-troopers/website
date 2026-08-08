import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'impactStat',
  title: 'Impact Stat',
  type: 'document',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      description: 'e.g. "lives supported since 2014"',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'value',
      title: 'Numeric value',
      description: 'Leave blank for non-numeric stats (e.g. "ID docs") — set Display value instead.',
      type: 'number',
    }),
    defineField({
      name: 'suffix',
      title: 'Suffix',
      description: 'e.g. "+" or "%". Only used together with Numeric value.',
      type: 'string',
    }),
    defineField({
      name: 'displayValue',
      title: 'Display value',
      description: 'Static text shown instead of an animated number, e.g. "ID docs", "Section 18A".',
      type: 'string',
    }),
    defineField({
      name: 'page',
      title: 'Page',
      type: 'string',
      options: {
        list: [
          {title: 'Home', value: 'home'},
          {title: 'Our Work', value: 'our-work'},
          {title: 'Donate', value: 'donate'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'order', title: 'Display order', type: 'number'}),
  ],
  preview: {
    select: {title: 'label', subtitle: 'page'},
  },
})
