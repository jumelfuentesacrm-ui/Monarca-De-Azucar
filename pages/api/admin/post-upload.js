import { createClient } from '@supabase/supabase-js'
import formidable from 'formidable'
import fs from 'fs'

export const config = { api: { bodyParser: false } }

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const form = formidable({ maxFileSize: 300 * 1024 * 1024 })
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: err.message })
    const file = Array.isArray(files.file) ? files.file[0] : files.file
    if (!file) return res.status(400).json({ error: 'No file' })

    const ext = file.originalFilename?.split('.').pop()?.toLowerCase() || 'mp4'
    const path = `posts/${Date.now()}.${ext}`
    const buffer = fs.readFileSync(file.filepath)

    const { error: uploadErr } = await supabase.storage
      .from('product-images')
      .upload(path, buffer, { contentType: file.mimetype, upsert: true })

    if (uploadErr) return res.status(500).json({ error: uploadErr.message })

    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path)
    return res.status(200).json({ url: publicUrl })
  })
}
