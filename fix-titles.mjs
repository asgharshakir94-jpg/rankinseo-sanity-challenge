import {config} from 'dotenv'
config({path: '.env.local'})
import {createClient as createSupabaseClient} from '@supabase/supabase-js'

const supabase = createSupabaseClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const isDryRun = process.argv.includes('--dry-run')

function titleCase(keyword) {
    const smallWords = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on', 'or', 'the', 'to', 'vs', 'vs.', 'with'])
    const cleaned = keyword.replace(/"/g, '')
    const words = cleaned.split(' ')
  
    return words
      .map((word, index) => {
        const lower = word.toLowerCase()
        const isFirstOrLast = index === 0 || index === words.length - 1
        if (!isFirstOrLast && smallWords.has(lower.replace(/[.,]$/, ''))) {
          return lower
        }
        return word.charAt(0).toUpperCase() + word.slice(1)
      })
      .join(' ')
  }
async function fixTitles() {
  const {data: articles, error} = await supabase
    .from('campaigns')
    .select('id, title, keyword')
    .is('title', null)

  if (error) {
    console.error('Supabase error:', error)
    return
  }

  console.log(`Found ${articles.length} articles with missing titles.`)
  console.log(isDryRun ? '--- DRY RUN: no changes will be made ---\n' : '--- LIVE RUN: updating database ---\n')

  for (const a of articles) {
    const newTitle = titleCase(a.keyword)
    console.log(`id ${a.id}: "${a.keyword}" -> "${newTitle}"`)

    if (!isDryRun) {
      const {error: updateError} = await supabase
        .from('campaigns')
        .update({title: newTitle})
        .eq('id', a.id)

      if (updateError) {
        console.error(`  Failed to update id ${a.id}:`, updateError)
      }
    }
  }

  console.log(`\nDone. ${articles.length} articles ${isDryRun ? 'would be' : 'were'} updated.`)
}

fixTitles()