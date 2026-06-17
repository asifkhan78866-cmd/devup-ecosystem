import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: __dirname + '/../.env' })

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function createBuckets() {
  const bucketsToCreate = [
    process.env.STORAGE_BUCKET_LOGOS || 'startup-logos',
    process.env.STORAGE_BUCKET_BANNERS || 'startup-banners',
    process.env.STORAGE_BUCKET_DOCUMENTS || 'legal-documents',
    process.env.STORAGE_BUCKET_RESUMES || 'candidate-resumes',
    process.env.STORAGE_BUCKET_PITCHDECKS || 'pitch-decks'
  ]

  for (const bucketName of bucketsToCreate) {
    console.log(`Ensuring bucket exists: ${bucketName}`)
    const { data: bucket, error } = await supabaseAdmin.storage.getBucket(bucketName)
    
    if (error && error.message.includes('Bucket not found')) {
      const { data: newBucket, error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
        fileSizeLimit: 10485760 // 10MB
      })
      if (createError) {
        console.error(`Failed to create bucket ${bucketName}:`, createError)
      } else {
        console.log(`Created bucket: ${bucketName}`)
      }
    } else if (error) {
      console.error(`Error checking bucket ${bucketName}:`, error)
    } else {
      console.log(`Bucket ${bucketName} already exists.`)
      // Update it to be public just in case
      await supabaseAdmin.storage.updateBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      })
    }
  }
}

createBuckets().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
