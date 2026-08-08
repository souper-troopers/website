import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'teamMember',
  title: 'Team Member',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'role', title: 'Role', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'photo', title: 'Photo', type: 'image', options: {hotspot: true}}),
    defineField({name: 'order', title: 'Display order', type: 'number'}),
  ],
  preview: {
    select: {title: 'name', subtitle: 'role'},
  },
})
