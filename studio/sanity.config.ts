import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
// Subpath import — see the note in tools/PublishTool.tsx.
import {RocketIcon} from '@sanity/icons/Rocket'
import {schemaTypes} from './schemaTypes'
import {PublishTool} from './tools/PublishTool'

export default defineConfig({
  name: 'default',
  title: 'Souper Troopers',

  projectId: 'wqa0no5g',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Site Settings')
              .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
            S.divider(),
            ...S.documentTypeListItems().filter((item) => item.getId() !== 'siteSettings'),
          ]),
    }),
    visionTool(),
  ],

  // Appended to whatever the plugins above contribute, rather than replacing it — an array here
  // would drop the structure and vision tools entirely.
  tools: (prev) => [
    ...prev,
    {
      name: 'publish',
      title: 'Publish',
      icon: RocketIcon,
      component: PublishTool,
    },
  ],

  schema: {
    types: schemaTypes,
  },
})
