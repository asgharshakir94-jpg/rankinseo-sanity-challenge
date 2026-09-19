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

async function clearAll() {
  const ids = await sanity.fetch('*[_type == "article"]._id')
  console.log(`Deleting ${ids.length} articles...`)
  for (const id of ids) {
    await sanity.delete(id)
  }
  console.log('Done clearing.')
}

clearAll()