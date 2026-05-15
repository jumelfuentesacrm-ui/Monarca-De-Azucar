import { createClient } from '@supabase/supabase-js'
import formidable from 'formidable'
import fs from 'fs'

export const config = { api: { bodyParser: false } }

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { user_id, file } = req.query
    if (!user_id) return res.status(400).json({ error: 'user_id requerido' })

    // Get signed URL for a specific file
    if (file) {
      const path = `clients/${user_id}/${file}`
      const { data, error } = await supabaseAdmin.storage.from('client-files').createSignedUrl(path, 300)
      if (error) return res.status(500).json({ error: error.message })
      return res.redirect(data.signedUrl)
    }

    // List all files for user
    const { data, error } = await supabaseAdmin.storage.from('client-files').list(`clients/${user_id}`, { sortBy: { column: 'created_at', order: 'desc' } })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ files: data || [] })
  }

  if (req.method === 'POST') {
    const form = formidable({ maxFileSize: 10 * 1024 * 1024 })
    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).json({ error: err.message })
      const userId = Array.isArray(fields.user_id) ? fields.user_id[0] : fields.user_id
      const file = Array.isArray(files.file) ? files.file[0] : files.file
      if (!file || !userId) return res.status(400).json({ error: 'Faltan datos' })
      const buffer = fs.readFileSync(file.filepath)
      const path = `clients/${userId}/${Date.now()}_${file.originalFilename}`
      const { error } = await supabaseAdmin.storage.from('client-files').upload(path, buffer, { contentType: file.mimetype })
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ success: true })
    })
    return
  }

  if (req.method === 'DELETE') {
    const buffers = []
    for await (const chunk of req) buffers.push(chunk)
    const body = JSON.parse(Buffer.concat(buffers).toString())
    const { path } = body
    await supabaseAdmin.storage.from('client-files').remove([path])
    return res.status(200).json({ success: true })
  }

  res.status(405).end()
}
