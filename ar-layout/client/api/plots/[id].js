import { dbConnect, Plot } from '../db.js'

export default async function handler(req, res) {
  await dbConnect()

  const { id } = req.query
  if (!id) {
    return res.status(400).json({ error: 'Plot id is required' })
  }

  if (req.method === 'PUT') {
    const updated = await Plot.findByIdAndUpdate(id, req.body, { new: true, runValidators: true }).lean()
    if (!updated) {
      return res.status(404).json({ error: 'Plot not found' })
    }
    return res.status(200).json(updated)
  }

  if (req.method === 'DELETE') {
    const deleted = await Plot.findByIdAndDelete(id).lean()
    if (!deleted) {
      return res.status(404).json({ error: 'Plot not found' })
    }
    return res.status(200).json({ success: true })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
