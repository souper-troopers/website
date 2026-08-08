import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'successStory',
  title: 'Success Story',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'quote',
      title: 'Quote',
      description: 'A direct quote from this person, if we have one.',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'body',
      title: 'Story',
      description: 'A short description of their journey.',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'featured',
      title: 'Featured on homepage',
      description: 'Show this story on the homepage, not just the Our Work page.',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'order',
      title: 'Display order',
      type: 'number',
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'body'},
  },
})
