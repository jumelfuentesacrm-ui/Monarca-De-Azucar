import { createClient } from '@supabase/supabase-js'
import formidable from 'formidable'
import fs from 'fs'

export const config = { api: { bodyParser: false } }

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const form = formidable({ maxFileSize: 8 * 1024 * 1024 })
    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).json({ error: err.message })
      const product_id = Array.isArray(fields.product_id) ? fields.product_id[0] : fields.product_id
      const file = Array.isArray(files.file) ? files.file[0] : files.file
      if (!file || !product_id) return res.status(400).json({ error: 'Faltan datos' })

      const ext = file.originalFilename?.split('.').pop() || 'jpg'
      const path = `products/${product_id}/image.${ext}`
      const buffer = fs.readFileSync(file.filepath)

      // Remove old images for this product before uploading
      const { data: existing } = await supabase.storage.from('product-images').list(`products/${product_id}`)
      if (existing?.length) {
        await supabase.storage.from('product-images').remove(existing.map(f => `products/${product_id}/${f.name}`))
      }

      const { error: uploadErr } = await supabase.storage.from('product-images').upload(path, buffer, {
        contentType: file.mimetype,
        upsert: true,
      })
      if (uploadErr) return res.status(500).json({ error: uploadErr.message })

      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path)

      // Bust cache by appending timestamp
      const imageUrl = publicUrl + '?t=' + Date.now()

      await supabase.from('catalog_items').update({ image_url: imageUrl }).eq('id', product_id)

      return res.status(200).json({ image_url: imageUrl })
    })
    return
  }

  if (req.method === 'DELETE') {
    const buffers = []
    for await (const chunk of req) buffers.push(chunk)
    const { product_id } = JSON.parse(Buffer.concat(buffers).toString())
    if (!product_id) return res.status(400).json({ error: 'product_id required' })

    const { data: existing } = await supabase.storage.from('product-images').list(`products/${product_id}`)
    if (existing?.length) {
      await supabase.storage.from('product-images').remove(existing.map(f => `products/${product_id}/${f.name}`))
    }
    await supabase.from('catalog_items').update({ image_url: null }).eq('id', product_id)
    return res.status(200).json({ success: true })
  }

  res.status(405).end()
}
