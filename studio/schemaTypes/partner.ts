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
    defineField({
      name: 'url',
      title: 'Website',
      description: 'Their own site. With this set, their card on Who We Are links to it.',
      type: 'url',
    }),
    defineField({
      name: 'featured',
      title: 'Lead partner',
      description:
        'Shows this partner first, as a larger entry at the top of Partners & supporters. One partner at a time - the review agreed this is for Woolworths once the partnership is confirmed.',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'blurb'},
  },
})
