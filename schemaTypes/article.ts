import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({name: 'slug', title: 'Slug', type: 'string'}),
    defineField({name: 'keyword', title: 'Keyword', type: 'string'}),
    defineField({name: 'trade', title: 'Trade', type: 'string'}),
    defineField({name: 'content', title: 'Content', type: 'text'}),
    defineField({name: 'hasCta', title: 'Has CTA', type: 'boolean'}),
    defineField({name: 'impressions', title: 'GSC Impressions', type: 'number'}),
    defineField({name: 'publishedAt', title: 'Published At', type: 'datetime'}),
  ],
})