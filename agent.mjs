import {config} from 'dotenv'
config({path: '.env.local'})
import {createClient} from '@sanity/client'

const sanity = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  apiVersion: '2026-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

const STOPWORDS = new Set(['a', 'an', 'the', 'for', 'your', 'to', 'in', 'of', 'and', 'is', 'on', 'with', 'you', 'how'])

function normalize(title) {
  return (title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(' ')
    .filter(w => w && !STOPWORDS.has(w))
}

function similarity(wordsA, wordsB) {
  const setA = new Set(wordsA)
  const setB = new Set(wordsB)
  const intersection = [...setA].filter(w => setB.has(w))
  const union = new Set([...setA, ...setB])
  return union.size === 0 ? 0 : intersection.length / union.size
}

async function runAgent() {
  console.log('Querying content via GROQ...\n')

  const articles = await sanity.fetch(`
    *[_type == "article"] {
      title,
      slug,
      trade
    } | order(trade asc)
  `)

  console.log(`Analyzing ${articles.length} articles for potential duplicate content...\n`)

  const withWords = articles.map(a => ({...a, words: normalize(a.title)}))

  const flagged = []
  for (let i = 0; i < withWords.length; i++) {
    for (let j = i + 1; j < withWords.length; j++) {
      const score = similarity(withWords[i].words, withWords[j].words)
      if (score >= 0.4) {
        flagged.push({a: withWords[i], b: withWords[j], score})
      }
    }
  }

  if (flagged.length === 0) {
    console.log('No significant title overlap detected — content set looks well-differentiated.')
  } else {
    console.log('=== Potential Duplicate/Overlapping Content ===\n')
    for (const f of flagged.sort((x, y) => y.score - x.score)) {
      console.log(`[${Math.round(f.score * 100)}% overlap]`)
      console.log(`  A: "${f.a.title}" (${f.a.trade}, ${f.a.slug})`)
      console.log(`  B: "${f.b.title}" (${f.b.trade}, ${f.b.slug})`)
      console.log('')
    }
  }

  console.log(`Checked ${articles.length} articles, found ${flagged.length} potential overlap(s).`)
}

runAgent()