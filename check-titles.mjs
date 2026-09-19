import {config} from 'dotenv'
config({path: '.env.local'})
import {createClient as createSupabaseClient} from '@supabase/supabase-js'

const supabase = createSupabaseClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function looksLikeSlug(title) {
  if (!title) return false
  // all lowercase, contains hyphens, no spaces
  return title === title.toLowerCase() && title.includes('-') && !title.includes(' ')
}

async function checkTitles() {
  const {data: articles, error} = await supabase
    .from('campaigns')
    .select('id, title, slug, keyword')

  if (error) {
    console.error('Supabase error:', error)
    return
  }

  const nullTitles = articles.filter(a => !a.title)
  const slugLikeTitles = articles.filter(a => looksLikeSlug(a.title))

  console.log(`Total articles: ${articles.length}`)
  console.log(`\n--- NULL titles (${nullTitles.length}) ---`)
  nullTitles.forEach(a => console.log(`id ${a.id}: slug="${a.slug}", keyword="${a.keyword}"`))

  console.log(`\n--- Slug-like titles (${slugLikeTitles.length}) ---`)
  slugLikeTitles.forEach(a => console.log(`id ${a.id}: title="${a.title}"`))
}

checkTitles()