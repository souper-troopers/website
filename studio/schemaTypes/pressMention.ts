import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'pressMention',
  title: 'Press mention',
  type: 'document',
  description:
    'Coverage of Souper Troopers in the media, shown as an "in the news" row on the Who We Are page.',
  fields: [
    defineField({
      name: 'publication',
      title: 'Publication',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'url', title: 'Link to the article', type: 'url'}),
    defineField({
      name: 'date',
      title: 'Published',
      type: 'date',
      description: 'Used to order the list, newest first.',
    }),
  ],
  preview: {
    select: {title: 'headline', subtitle: 'publication'},
  },
})
