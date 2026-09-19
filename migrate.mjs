import {config} from 'dotenv'
config({path: '.env.local'})
import {createClient} from '@sanity/client'
import {createClient as createSupabaseClient} from '@supabase/supabase-js'

const sanity = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  apiVersion: '2026-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

const supabase = createSupabaseClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TRADES = {
  roofing: ['roof', 'roofing', 'shingle', 'hail'],
  hvac: ['hvac', 'furnace', 'inverter', 'heating', 'air condition'],
  plumbing: ['plumb', 'sewer', 'leak', 'pipe'],
  solar: ['solar', 'panel', 'installer'],
  electrical: ['electric', 'electrician'],
}

function matchTrade(keyword) {
  const lower = (keyword || '').toLowerCase()
  for (const [trade, terms] of Object.entries(TRADES)) {
    if (terms.some(term => lower.includes(term))) return trade
  }
  return null
}

async function migrate() {
  console.log('Fetching articles from Supabase...')

  const {data: articles, error} = await supabase
    .from('campaigns')
    .select('title, slug, keyword, content, created_at, status')
    .not('slug', 'is', null)
    .limit(130)

  if (error) {
    console.error('Supabase error:', error)
    return
  }

  const grouped = {}
  for (const a of articles) {
    const trade = matchTrade(a.keyword)
    if (!trade) continue
    if (!grouped[trade]) grouped[trade] = []
    if (grouped[trade].length < 5) grouped[trade].push(a)
  }

  const selected = Object.values(grouped).flat()
  console.log(`Selected ${selected.length} articles across ${Object.keys(grouped).length} trades:`)
  for (const [trade, list] of Object.entries(grouped)) {
    console.log(`  ${trade}: ${list.length}`)
  }

  for (const a of selected) {
    const trade = matchTrade(a.keyword)
    const hasCta = a.content?.includes('/audit') || a.content?.includes('-calculator')
    await sanity.create({
      _type: 'article',
      title: a.title,
      slug: a.slug,
      keyword: a.keyword,
      trade,
      content: a.content ? a.content.slice(0, 500) : '',
      hasCta,
      publishedAt: a.created_at,
    })
    console.log(`Migrated (${trade}): ${a.slug}`)
  }

  console.log(`Done — ${selected.length} articles migrated.`)
}

migrate()