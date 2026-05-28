import { dbConnect, MapState, Plot } from './db.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Only GET is allowed' })
    return
  }

  await dbConnect()

  const [mapState, plots] = await Promise.all([
    MapState.findOne({ key: 'main' }).lean(),
    Plot.find().sort({ createdAt: 1 }).lean(),
  ])

  res.status(200).json({ mapImage: mapState?.mapImage || null, plots })
}
