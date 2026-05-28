import mongoose from 'mongoose'

const MONGO_URI = process.env.MONGO_URI
if (!MONGO_URI) {
  throw new Error('Missing MONGO_URI environment variable')
}

const globalWithMongoose = globalThis

if (!globalWithMongoose._mongoose) {
  globalWithMongoose._mongoose = { conn: null, promise: null }
}

const db = globalWithMongoose._mongoose

async function dbConnect() {
  if (db.conn) return db.conn
  if (!db.promise) {
    db.promise = mongoose.connect(MONGO_URI, { dbName: 'ar_layout', autoIndex: false }).then(m => m.connection)
  }
  db.conn = await db.promise
  return db.conn
}

const plotSchema = new mongoose.Schema({
  number: { type: String, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  sold: { type: Boolean, required: true, default: false },
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

const Plot = mongoose.models.Plot || mongoose.model('Plot', plotSchema)
const MapState = mongoose.models.MapState || mongoose.model('MapState', mapSchema)

export { dbConnect, Plot, MapState }
