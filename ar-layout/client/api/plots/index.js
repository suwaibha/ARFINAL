import { dbConnect, Plot } from '../db.js'

export default async function handler(req, res) {
  await dbConnect()

  if (req.method === 'GET') {
    const plots = await Plot.find().sort({ createdAt: 1 }).lean()
    return res.status(200).json(plots)
  }

  if (req.method === 'POST') {
    try {
      const plot = await Plot.create(req.body)
      return res.status(201).json(plot)
    } catch (error) {
      return res.status(400).json({ error: error.message || 'Failed to create plot' })
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}
