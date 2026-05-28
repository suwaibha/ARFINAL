import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import mongoose from 'mongoose'
import { fileURLToPath } from 'url'

dotenv.config({ path: fileURLToPath(new URL('./.env', import.meta.url)) })

const MONGO_URI = process.env.MONGO_URI
const PORT = process.env.PORT || 4000

if (!MONGO_URI) {
  console.error('Missing MONGO_URI in .env')
  process.exit(1)
}

const app = express()
app.use(cors())
app.use(express.json({ limit: '12mb' }))

const plotSchema = new mongoose.Schema({
  number: { type: String, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  sold: { type: Boolean, default: false },
  buyerName: { type: String, default: '' },
  phone: { type: String, default: '' },
  saleAmount: { type: String, default: '' },
  saleDate: { type: String, default: '' },
  notes: { type: String, default: '' },
}, { timestamps: true })

const mapSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'main' },
  mapImage: { type: String, default: null },
}, { timestamps: true })

const Plot = mongoose.model('Plot', plotSchema)
const MapState = mongoose.model('MapState', mapSchema)

app.get('/api/state', async (req, res) => {
  try {
    const [mapState, plots] = await Promise.all([
      MapState.findOne({ key: 'main' }).lean(),
      Plot.find().sort({ createdAt: 1 }).lean(),
    ])

    res.json({ mapImage: mapState?.mapImage || null, plots })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to load application state' })
  }
})

app.post('/api/map', async (req, res) => {
  try {
    const { mapImage } = req.body
    if (!mapImage) {
      return res.status(400).json({ error: 'Missing mapImage' })
    }

    const state = await MapState.findOneAndUpdate(
      { key: 'main' },
      { mapImage },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean()

    res.json(state)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to save map image' })
  }
})

app.get('/api/plots', async (req, res) => {
  try {
    const plots = await Plot.find().sort({ createdAt: 1 }).lean()
    res.json(plots)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to load plots' })
  }
})

app.post('/api/plots', async (req, res) => {
  try {
    const plot = await Plot.create(req.body)
    res.status(201).json(plot)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to create plot' })
  }
})

app.put('/api/plots/:id', async (req, res) => {
  try {
    const plot = await Plot.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean()
    if (!plot) {
      return res.status(404).json({ error: 'Plot not found' })
    }
    res.json(plot)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to update plot' })
  }
})

app.delete('/api/plots/:id', async (req, res) => {
  try {
    const deleted = await Plot.findByIdAndDelete(req.params.id).lean()
    if (!deleted) {
      return res.status(404).json({ error: 'Plot not found' })
    }
    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to delete plot' })
  }
})

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

const start = async () => {
  try {
    await mongoose.connect(MONGO_URI)
    console.log('Connected to MongoDB')
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('MongoDB connection failed', error)
    process.exit(1)
  }
}

start()
