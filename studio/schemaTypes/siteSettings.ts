import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({name: 'address', title: 'Address', type: 'string'}),
    defineField({name: 'email', title: 'Email', type: 'string'}),
    defineField({name: 'npoNumber', title: 'NPO number', type: 'string'}),
    defineField({name: 'pboNumber', title: 'PBO number', type: 'string'}),
    defineField({name: 'bbbeeLevel', title: 'B-BBEE level', type: 'string'}),
    defineField({name: 'tagline', title: 'Tagline', type: 'string'}),
  ],
})
