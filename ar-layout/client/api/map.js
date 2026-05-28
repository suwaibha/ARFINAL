import { dbConnect, MapState } from './db.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Only POST is allowed' })
    return
  }

  await dbConnect()

  const { mapImage } = req.body
  if (!mapImage) {
    res.status(400).json({ error: 'Missing mapImage' })
    return
  }

  const state = await MapState.findOneAndUpdate(
    { key: 'main' },
    { mapImage },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean()

  res.status(200).json(state)
}
