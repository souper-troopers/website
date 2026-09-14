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
      name: 'video',
      title: 'Video link',
      description:
        'Optional. A YouTube or Vimeo link (unlisted is fine). It shows on the story card as a picture with a play button, and only loads when someone presses play. Leave it empty and the story looks exactly as it does now.',
      type: 'url',
      validation: (rule) =>
        rule.uri({scheme: ['https']}).custom((value) => {
          if (!value) return true
          return /^https:\/\/((www|m)\.)?(youtube\.com|youtu\.be|vimeo\.com|player\.vimeo\.com)\//.test(value)
            ? true
            : 'Use a YouTube or Vimeo link.'
        }),
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
