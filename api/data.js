// /api/data.js
// Vercel Serverless Function — GET loads the CRM data, POST saves it.
// Connects to MongoDB Atlas using the MONGODB_URI environment variable
// that you set in Vercel Project Settings → Environment Variables.

const { MongoClient } = require('mongodb');

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) return cachedDb;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'MONGODB_URI environment variable set nahi hai. Vercel Project Settings -> Environment Variables mein add karein.'
    );
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('aa_alarm_crm'); // database name — khud ban jayega agar exist nahi karta

  cachedClient = client;
  cachedDb = db;
  return db;
}

module.exports = async function handler(req, res) {
  // CORS headers (helpful for local testing, harmless on Vercel itself)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const db = await connectToDatabase();
    const col = db.collection('crm_data');

    if (req.method === 'GET') {
      const doc = await col.findOne({ _id: 'main' });
      return res.status(200).json(doc || {});
    }

    if (req.method === 'POST') {
      // Vercel auto-parses JSON body when Content-Type: application/json is sent
      const body = req.body && typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
      await col.updateOne({ _id: 'main' }, { $set: body }, { upsert: true });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('API /api/data error:', e);
    return res.status(500).json({ error: e.message });
  }
};
