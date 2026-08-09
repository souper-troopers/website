import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'partner',
  title: 'Partner',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'blurb',
      title: 'Blurb',
      description: 'One or two sentences on how they support Souper Troopers.',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'logo', title: 'Logo', type: 'image', options: {hotspot: true}}),
    defineField({
      name: 'logoOnDark',
      title: 'Logo needs a dark background',
      description:
        'Turn this on if the logo is white or very light and disappears on the white card behind it (e.g. a reversed/white-only version of the logo).',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({name: 'order', title: 'Display order', type: 'number'}),
  ],
  preview: {
    select: {title: 'name', subtitle: 'blurb'},
  },
})
