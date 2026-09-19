import {config} from 'dotenv'
config({path: '.env.local'})
import {createClient as createSupabaseClient} from '@supabase/supabase-js'

const supabase = createSupabaseClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

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

async function runFullCheck() {
  console.log('Fetching all articles from Supabase...\n')

  const {data: articles, error} = await supabase
    .from('campaigns')
    .select('id, title, slug')

  if (error) {
    console.error('Supabase error:', error)
    return
  }

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
    console.log('No significant title overlap detected.')
  } else {
    console.log('=== Potential Duplicate/Overlapping Content ===\n')
    for (const f of flagged.sort((x, y) => y.score - x.score)) {
      console.log(`[${Math.round(f.score * 100)}% overlap]`)
      console.log(`  A: "${f.a.title}" (id ${f.a.id}, ${f.a.slug})`)
      console.log(`  B: "${f.b.title}" (id ${f.b.id}, ${f.b.slug})`)
      console.log('')
    }
  }

  console.log(`Checked ${articles.length} articles, found ${flagged.length} potential overlap(s).`)
}

runFullCheck()