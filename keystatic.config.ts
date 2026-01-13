import { config, fields, collection } from '@keystatic/core';

export default config({
  storage: {
    kind: 'local',
  },
  collections: {
    tech: collection({
      label: 'Tech Posts',
      slugField: 'title',
      path: 'content/tech/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        summary: fields.text({
          label: 'Summary',
          description: 'Brief summary of the post',
        }),
        publishedAt: fields.date({
          label: 'Published At',
          defaultValue: { kind: 'today' },
        }),
        tags: fields.array(
          fields.text({ label: 'Tag' }),
          {
            label: 'Tags',
            itemLabel: (props) => props.value,
          }
        ),
        difficulty: fields.select({
          label: 'Difficulty',
          options: [
            { label: 'Beginner', value: 'beginner' },
            { label: 'Intermediate', value: 'intermediate' },
            { label: 'Advanced', value: 'advanced' },
          ],
          defaultValue: 'intermediate',
        }),
        githubLink: fields.url({
          label: 'GitHub Link',
          description: 'Optional GitHub repository link',
        }),
        content: fields.markdoc({
          label: 'Content',
          options: {
            image: {
              directory: 'public/images/tech',
              publicPath: '/images/tech/',
            },
          },
        }),
      },
    }),
    life: collection({
      label: 'Life Posts',
      slugField: 'title',
      path: 'content/life/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        visitDate: fields.date({
          label: 'Visit Date',
          defaultValue: { kind: 'today' },
        }),
        category: fields.select({
          label: 'Category',
          options: [
            { label: 'Restaurant', value: 'restaurant' },
            { label: 'Cafe', value: 'cafe' },
            { label: 'Travel', value: 'travel' },
            { label: 'Concert', value: 'concert' },
          ],
          defaultValue: 'restaurant',
        }),
        location: fields.text({
          label: 'Location',
          description: 'Place name or address',
        }),
        rating: fields.number({
          label: 'Rating',
          description: 'Rating out of 5',
          validation: {
            min: 0,
            max: 5,
          },
        }),
        thumbnail: fields.image({
          label: 'Thumbnail',
          directory: 'public/images/life/thumbnails',
          publicPath: '/images/life/thumbnails/',
        }),
        gallery: fields.array(
          fields.image({
            label: 'Image',
            directory: 'public/images/life/gallery',
            publicPath: '/images/life/gallery/',
          }),
          {
            label: 'Gallery',
            itemLabel: (props) => props.value?.filename || 'Image',
          }
        ),
        content: fields.markdoc({
          label: 'Content',
          options: {
            image: {
              directory: 'public/images/life',
              publicPath: '/images/life/',
            },
          },
        }),
      },
    }),
  },
});
