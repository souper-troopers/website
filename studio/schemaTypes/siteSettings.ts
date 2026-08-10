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
    defineField({
      name: 'bbbeeLastVerified',
      title: 'B-BBEE figures last verified',
      type: 'date',
      description:
        'Shown next to the B-BBEE benefits on Get Involved. Update whenever the figures are re-checked with a B-BBEE practitioner.',
    }),
    defineField({
      name: 'bbbeeNote',
      title: 'B-BBEE footnote',
      type: 'text',
      rows: 4,
      description:
        'Caveats shown under the B-BBEE benefits — which scorecard the figures apply to, and that this is general information rather than advice.',
    }),
  ],
})
