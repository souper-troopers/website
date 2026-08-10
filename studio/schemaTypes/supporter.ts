import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'supporter',
  title: 'Supporter',
  type: 'document',
  description:
    'Businesses and individuals who support Souper Troopers, listed by name under the partners on the Who We Are page. Partners (with logos and descriptions) are a separate type.',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'Website',
      type: 'url',
      description: 'Optional. If set, the name becomes a link.',
    }),
    defineField({
      name: 'note',
      title: 'Note',
      type: 'string',
      description: 'Optional short note, e.g. "meals" or "venue hire".',
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'note'},
  },
})
