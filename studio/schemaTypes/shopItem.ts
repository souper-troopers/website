import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'shopItem',
  title: 'Shop item',
  type: 'document',
  description: 'One individually-purchasable item within a "grid of items" category (e.g. one Worry Doll style).',
  fields: [
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'productCategory'}],
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description:
        'Used in the URL, e.g. "india-harris" for /shop/worry-dolls/india-harris. Leave blank and one is generated from the name — but once a product has been shared or indexed, set it explicitly so the URL stops changing if the name is edited.',
      options: {source: 'name'},
    }),
    defineField({name: 'price', title: 'Price (R)', type: 'number', validation: (rule) => rule.required()}),
    defineField({
      name: 'photo',
      title: 'Main photo',
      description: 'Shown on the product card in the shop, and first on the product page.',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'gallery',
      title: 'More photos',
      description:
        'Extra photos of this product, shown as a swipeable carousel on its own page after the main photo. For handmade items, show the range: a few different examples of the same style.',
      type: 'array',
      of: [{type: 'image', options: {hotspot: true}}],
      options: {layout: 'grid'},
    }),
    defineField({
      name: 'description',
      title: 'Short description',
      description: 'One or two lines, shown on the product card in the category grid.',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'details',
      title: 'Full description',
      description:
        'The longer write-up shown on the product’s own page — materials, size, who made it, the story behind it. This is what search engines and AI assistants read when deciding whether to surface this product, so specifics beat adjectives.',
      type: 'text',
      rows: 6,
    }),
    defineField({
      name: 'soldOut',
      title: 'Sold out',
      description:
        'Tick when this item is unavailable. Hides the Add to cart button and tells search engines it is out of stock. Untick when back in stock.',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({name: 'order', title: 'Display order', type: 'number'}),
  ],
  preview: {
    select: {title: 'name', subtitle: 'price', media: 'photo', soldOut: 'soldOut'},
    prepare: ({title, subtitle, media, soldOut}) => ({
      title,
      subtitle: [subtitle ? `R${subtitle}` : undefined, soldOut ? 'Sold out' : undefined]
        .filter(Boolean)
        .join(' · '),
      media,
    }),
  },
})
